---
title: "DeepSeek Fine-Tuning Hands-On: LoRA Efficient Fine-Tuning with Custom Datasets"
description: "Complete DeepSeek model fine-tuning tutorial: LoRA/QLoRA parameter-efficient fine-tuning, dataset construction, training configuration, model evaluation. Includes vLLM deployment of fine-tuned models with complete Python workflow."
category: "DeepSeek"
date: 2026-06-25
tags: ["DeepSeek", "Fine-Tuning", "LoRA", "Training", "Deployment", "vLLM", "Expert"]
level: "Expert"
---

## What This Tutorial Solves

You will learn to fine-tune DeepSeek models for specific tasks:

- LoRA / QLoRA parameter-efficient fine-tuning
- Custom dataset construction and cleaning
- Training configuration optimization
- Model evaluation and comparison
- vLLM deployment of fine-tuned models

> 🎯 General model + Fine-tuning = Specialized model. Fine-tuned DeepSeek can improve accuracy in specific domains by 30-50%.

---

## Why Fine-Tune?

Fine-tuning is more effective than prompt engineering in these scenarios:

| Scenario | Prompt Engineering | Fine-Tuning | Recommendation |
|------|---------|------|------|
| General Q&A | ✅ Good | ⚠️ Overkill | Prompt Engineering |
| Domain terminology translation | ⚠️ Average | ✅ Excellent | **Fine-Tuning** |
| Specific format output | ⚠️ Unstable | ✅ Stable | **Fine-Tuning** |
| Customer service scripts | ⚠️ Acceptable | ✅ More natural | **Fine-Tuning** |
| Code style conversion | ❌ Poor | ✅ Excellent | **Fine-Tuning** |

---

## Step 1: Environment Setup

```bash
pip install torch transformers datasets peft accelerate bitsandbytes wandb
```

```python
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForSeq2Seq,
)
from datasets import Dataset
from peft import (
    LoraConfig,
    get_peft_model,
    TaskType,
    PeftModel,
    prepare_model_for_kbit_training,
)
import json
import os

# Check GPU
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
```

---

## Step 2: Dataset Construction

```python
def build_custom_dataset() -> Dataset:
    """Build a custom conversation dataset"""

    # Example: customer service script dataset
    conversations = [
        {
            "instruction": "You are an e-commerce customer service agent. The user is asking about the return process.",
            "input": "The screen of the phone I bought is broken. Can I return it?",
            "output": "I'm very sorry to hear about the issue with your phone. If the item was received within 7 days and the damage is not caused by misuse, you can apply for a return. Please go to 'My Orders' in the app, find the order, click 'Apply for After-Sales', and upload photos showing the current condition of the phone. We will review it within 24 hours. If the damage is due to misuse, we recommend visiting an authorized repair center nearby.",
        },
        {
            "instruction": "You are an e-commerce customer service agent. The user is asking about shipping.",
            "input": "Where's my package? It's been 3 days already.",
            "output": "Hello, let me check that for you. Please provide your order number and I'll look up the shipping status right away. Generally, standard shipping takes 3-5 business days, and remote areas may take 5-7 days. If it exceeds the promised delivery window, we will contact the courier to expedite the process.",
        },
        {
            "instruction": "You are an e-commerce customer service agent handling a complaint.",
            "input": "Your product quality is terrible. It broke after just one week!",
            "output": "I'm very sorry for the frustrating experience — I completely understand how you feel. Let me document this issue in detail. Could you describe exactly what happened? Based on the situation, we can arrange a return, exchange, or repair service to make sure your issue is properly resolved.",
        },
        # ... add more conversations (recommended 500-1000 minimum)
    ]

    # Expand dataset (500+ entries recommended for production)
    for i in range(50):
        variations = [
            {
                "instruction": "You are an e-commerce customer service agent. Handle user inquiries professionally and patiently.",
                "input": f"I'd like to know how to change my shipping address (variant {i})",
                "output": f"Hello! Here's how to change your shipping address: 1) If the order hasn't shipped yet, go to the order details page and click 'Modify Address'; 2) If it has already shipped, contact our customer service and we'll coordinate with the courier to update the delivery address. We recommend doing this as soon as possible since it gets more complicated once the package is in transit.",
            },
            {
                "instruction": "You are an e-commerce customer service agent. Handle user inquiries professionally and patiently.",
                "input": f"What payment methods do you support? (variant {i})",
                "output": f"We support the following payment methods: WeChat Pay, Alipay, bank cards (debit and credit), and installment plans (3/6/12 months). If you encounter an issue with bank card payment, we recommend first checking that your online payment feature is enabled.",
            },
        ]
        conversations.extend(variations)

    # Convert to model training format
    def format_conversation(example):
        """Format conversations using the chat template"""
        text = f"""<|system|>
{example['instruction']}</s>
<|user|>
{example['input']}</s>
<|assistant|>
{example['output']}</s>"""
        return {"text": text}

    dataset = Dataset.from_list(conversations)
    dataset = dataset.map(format_conversation)

    # Split into training/validation sets
    split = dataset.train_test_split(test_size=0.1, seed=42)

    return split["train"], split["test"]

train_dataset, eval_dataset = build_custom_dataset()
print(f"Training set: {len(train_dataset)} entries, Validation set: {len(eval_dataset)} entries")
```

### Dataset Quality Checklist

```python
def validate_dataset(dataset: Dataset) -> dict:
    """Validate dataset quality"""
    stats = {
        "Sample count": len(dataset),
        "Average input length": 0,
        "Average output length": 0,
        "Empty outputs": 0,
        "Duplicate samples": 0,
    }

    inputs = []
    outputs = []
    seen = set()

    for item in dataset:
        inp = item.get("input", "")
        out = item.get("output", "")

        inputs.append(len(inp))
        outputs.append(len(out))

        if not out.strip():
            stats["Empty outputs"] += 1

        key = inp + out
        if key in seen:
            stats["Duplicate samples"] += 1
        seen.add(key)

    stats["Average input length"] = sum(inputs) / len(inputs) if inputs else 0
    stats["Average output length"] = sum(outputs) / len(outputs) if outputs else 0

    print("Dataset Quality Report:")
    for k, v in stats.items():
        print(f"  {k}: {v}")

    return stats

validate_dataset(train_dataset)
```

---

## Step 3: LoRA Fine-Tuning

```python
# Model configuration
MODEL_NAME = "deepseek-ai/deepseek-llm-7b-chat"  # or deepseek-coder
OUTPUT_DIR = "./deepseek-finetuned-cs"

# Load model and tokenizer
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True,
    padding_side="right",
)
tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16,  # Mixed precision training
    device_map="auto",
    trust_remote_code=True,
)

# LoRA Configuration
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,                     # LoRA rank (8-64, higher = more capacity but more params)
    lora_alpha=32,            # LoRA scaling factor
    lora_dropout=0.05,        # Dropout to prevent overfitting
    target_modules=[          # Modules to apply LoRA to
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    bias="none",
)

# Apply LoRA
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# Example output: trainable params: 41M || all params: 7B || trainable%: 0.58%
```

### QLoRA — Lower VRAM Usage

```python
# If VRAM is insufficient (<16GB), use QLoRA (4-bit quantization)
from transformers import BitsAndBytesConfig

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

model_qlora = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)

model_qlora = prepare_model_for_kbit_training(model_qlora)
model_qlora = get_peft_model(model_qlora, lora_config)
model_qlora.print_trainable_parameters()
```

---

## Step 4: Training

```python
# Training arguments
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,                  # Number of training epochs
    per_device_train_batch_size=4,       # Training batch size per GPU
    per_device_eval_batch_size=4,
    gradient_accumulation_steps=4,       # Gradient accumulation (effective batch_size=16)
    warmup_steps=100,                    # Warmup steps
    learning_rate=2e-4,                  # Learning rate
    lr_scheduler_type="cosine",          # Cosine annealing learning rate
    logging_steps=10,
    save_steps=100,
    eval_steps=100,
    evaluation_strategy="steps",
    save_total_limit=3,                  # Keep only the 3 best checkpoints
    load_best_model_at_end=True,
    fp16=True,                           # Mixed precision
    gradient_checkpointing=True,         # Save VRAM
    report_to="none",                    # Or "wandb"
    metric_for_best_model="eval_loss",
    greater_is_better=False,
)

# Data collator
def tokenize_function(examples):
    """Tokenize"""
    return tokenizer(
        examples["text"],
        truncation=True,
        max_length=512,
        padding="max_length",
    )

tokenized_train = train_dataset.map(tokenize_function, batched=True)
tokenized_eval = eval_dataset.map(tokenize_function, batched=True)

data_collator = DataCollatorForSeq2Seq(
    tokenizer=tokenizer,
    model=model,
    padding=True,
)

# Start training
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train,
    eval_dataset=tokenized_eval,
    data_collator=data_collator,
)

print("Starting training...")
trainer.train()

# Save model
trainer.save_model()
tokenizer.save_pretrained(OUTPUT_DIR)
print(f"Model saved to {OUTPUT_DIR}")
```

---

## Step 5: Model Evaluation

```python
def evaluate_model(model, tokenizer, test_cases: list[dict]) -> dict:
    """Evaluate the fine-tuned model"""

    results = []
    for case in test_cases:
        prompt = f"""<|system|>
{case['instruction']}</s>
<|user|>
{case['input']}</s>
<|assistant|>
"""

        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        outputs = model.generate(
            **inputs,
            max_new_tokens=256,
            temperature=0.7,
            do_sample=True,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id,
        )

        response = tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[1]:],
            skip_special_tokens=True,
        )

        results.append({
            "input": case["input"],
            "expected": case["output"],
            "generated": response,
        })

    return results

# Test cases
test_cases = [
    {
        "instruction": "You are an e-commerce customer service agent. Handle user inquiries professionally and patiently.",
        "input": "I want to return an item. What's the process?",
        "output": "",  # Not needed for evaluation
    },
    {
        "instruction": "You are an e-commerce customer service agent. Handle user inquiries professionally and patiently.",
        "input": "What's your after-sales phone number?",
        "output": "",
    },
]

results = evaluate_model(model, tokenizer, test_cases)

for i, r in enumerate(results):
    print(f"\nTest {i+1}:")
    print(f"  User: {r['input']}")
    print(f"  AI response: {r['generated'][:200]}...")
```

---

## Step 6: vLLM Deployment of Fine-Tuned Model

```python
# deploy.py — Deploy the fine-tuned model with vLLM
"""
Install:
pip install vllm
"""

from vllm import LLM, SamplingParams

# Load fine-tuned model
llm = LLM(
    model="./deepseek-finetuned-cs",
    tensor_parallel_size=1,      # Number of GPUs
    dtype="float16",
    max_model_len=2048,
    trust_remote_code=True,
)

sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.9,
    max_tokens=512,
)

# Batch inference
prompts = [
    "<|system|>You are an e-commerce customer service agent</s><|user|>How do I return an item?</s><|assistant|>",
    "<|system|>You are an e-commerce customer service agent</s><|user|>Do you support WeChat Pay?</s><|assistant|>",
]

outputs = llm.generate(prompts, sampling_params)

for prompt, output in zip(prompts, outputs):
    print(f"Input: {prompt[-50:]}")
    print(f"Output: {output.outputs[0].text}")
    print()
```

---

## Fine-Tuning Hyperparameter Tuning Guide

| Parameter | Recommended Range | Effect |
|------|---------|------|
| `r` (LoRA rank) | 8-64 | Higher = more capacity, more parameters |
| `lora_alpha` | 1-4× r | Controls the magnitude of LoRA updates |
| `learning_rate` | 1e-4 ~ 5e-4 | Too high → overfitting; too low → no convergence |
| `num_epochs` | 2-5 | 500 entries → 3-5 epochs; 5000 entries → 2-3 epochs |
| `batch_size` | 4-16 | Use gradient accumulation if VRAM is limited |
| `warmup_steps` | 5-10% of total steps | Warmup helps training stability |

---

## FAQ

### Q: How much data do I need for fine-tuning?

**A**: Minimum 100 high-quality samples can show noticeable improvement; recommended 500-2000 entries. Data quality matters more than quantity.

### Q: How much does fine-tuning cost?

**A**: Using LoRA to fine-tune a 7B model on a single A100 (40GB) with 500 entries takes about 30 minutes, with cloud GPU costs around $1.50.

### Q: Can I use a fine-tuned model commercially?

**A**: Yes. DeepSeek open-source models use the MIT license. However, your training data must not infringe on third-party copyrights.

---

## Next Steps

- [DeepSeek R1 Reasoning Guide](/tutorials/deepseek-r1-reasoning-guide/)
- [AI Agent Hands-On](/tutorials/ai-agent-chinese-models-guide/)
- [RAG Hands-On Tutorial](/tutorials/rag-chinese-ai-models-guide/)

> 📝 Based on DeepSeek-7B + LoRA + vLLM, tested June 2026.
