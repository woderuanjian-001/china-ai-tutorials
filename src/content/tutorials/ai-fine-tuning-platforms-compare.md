---
title: "China AI Model Fine-Tuning Platforms Compared: Alibaba PAI, LLaMA Factory, and ModelScope"
description: "Comprehensive comparison of model fine-tuning platforms: Alibaba Cloud PAI, LLaMA Factory, ModelScope SWIFT, and Zhipu fine-tuning. Includes LoRA/QLoRA fine-tuning code, cost comparison, and model evaluation. Ideal for developers needing custom models."
category: "Advanced Models"
date: 2026-06-27
tags: ["Fine-Tuning", "LoRA", "PAI", "LLaMA Factory", "ModelScope", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will master China's mainstream model fine-tuning platforms:

- Alibaba Cloud PAI model fine-tuning
- LLaMA Factory local/cloud fine-tuning
- ModelScope SWIFT framework
- Zhipu GLM fine-tuning
- Fine-tuning cost and effectiveness comparison

> 🎯 A general-purpose LLM is a generalist scoring 80 points. A fine-tuned model is a specialist scoring 95 points for your specific business domain.

---

## Fine-Tuning Platform Comparison

| Platform | Difficulty | GPU | Free Tier | Highlights |
|------|------|-----|------|------|
| **Alibaba Cloud PAI** | ⭐ | Cloud | Trial | Enterprise-grade fully managed |
| **LLaMA Factory** | ⭐⭐ | Local | ✅ Open Source | Most user-friendly open-source option |
| **ModelScope SWIFT** | ⭐⭐ | Local | ✅ Open Source | Alibaba ecosystem |
| **Zhipu Fine-Tuning** | ⭐ | Cloud | Limited | Optimized for GLM |
| **Unsloth** | ⭐⭐ | Local | ✅ Open Source | Up to 2x faster |

---

## LLaMA Factory — Top Open-Source Choice

```bash
# Install
git clone https://github.com/hiyouga/LLaMA-Factory.git
cd LLaMA-Factory
pip install -e ".[torch,metrics]"
```

### Fine-Tuning via Web UI

```bash
# Launch Web UI
llamafactory-cli webui

# Open http://localhost:7860
# 1. Select model: Qwen/Qwen2.5-7B
# 2. Select fine-tuning method: LoRA
# 3. Upload dataset (JSON format)
# 4. Configure parameters → start training
```

### Fine-Tuning via CLI

```python
# train_config.yaml
"""
### model
model_name_or_path: Qwen/Qwen2.5-7B-Instruct

### method
stage: sft
do_train: true
finetuning_type: lora
lora_rank: 8
lora_target: all

### dataset
dataset: my_custom_dataset
template: qwen
cutoff_len: 2048

### output
output_dir: saves/qwen2.5-7b-lora
logging_steps: 10
save_steps: 500

### train
per_device_train_batch_size: 2
gradient_accumulation_steps: 8
learning_rate: 5.0e-5
num_train_epochs: 3.0
lr_scheduler_type: cosine
warmup_ratio: 0.1
bf16: true
"""

# Start training
# llamafactory-cli train train_config.yaml
```

---

## ModelScope SWIFT

```python
# SWIFT fine-tuning example
from swift import Swift

# Load the model
model = Swift.from_pretrained(
    "Qwen/Qwen2.5-7B-Instruct",
    model_type="qwen2.5",
)

# LoRA configuration
lora_config = {
    "r": 8,
    "lora_alpha": 32,
    "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj"],
    "lora_dropout": 0.05,
}

# Load dataset
dataset = load_dataset("json", data_files="my_data.json")

# Start fine-tuning
model.train(
    dataset=dataset,
    learning_rate=5e-5,
    num_epochs=3,
    batch_size=4,
    lora_config=lora_config,
    output_dir="./qwen-lora",
)

# Merge and save
model.merge_lora()
model.save_pretrained("./qwen-finetuned")
```

### Dataset Format

```json
[
  {
    "messages": [
      {"role": "system", "content": "You are a customer support assistant"},
      {"role": "user", "content": "When will my order ship?"},
      {"role": "assistant", "content": "Hello, your order is expected to ship within 1-3 business days. You can log in to check the tracking status, or provide your order number and I'll look it up for you."}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "Do you support returns?"},
      {"role": "assistant", "content": "Yes we do! We offer a 7-day no-reason return policy. Within 7 days of receiving the product, you can request a return if the item is in good condition. Return process: Order Details → Request Return → Fill In Reason → Wait for Approval → Ship Item Back → Refund."}
    ]
  }
]
```

---

## Zhipu GLM Fine-Tuning

```python
from zhipuai import ZhipuAI

client = ZhipuAI(api_key=os.getenv("ZHIPU_API_KEY"))

# Create a fine-tuning job
job = client.fine_tuning.jobs.create(
    model="glm-4-flash",
    training_file="file-xxx",  # Uploaded training file ID
    hyper_parameters={
        "n_epochs": 3,
        "learning_rate_multiplier": 0.1,
        "batch_size": 4,
    },
    suffix="my-custom-glm",
)

print(f"Fine-tuning job created: {job.id}")

# Monitor progress
while True:
    status = client.fine_tuning.jobs.retrieve(job.id)
    print(f"Status: {status.status}")
    if status.status in ["succeeded", "failed"]:
        break
    time.sleep(60)

# Use the fine-tuned model
if status.status == "succeeded":
    response = client.chat.completions.create(
        model=status.fine_tuned_model,  # ft:glm-4-flash:my-custom-glm:xxx
        messages=[{"role": "user", "content": "When will my order ship?"}],
    )
    print(response.choices[0].message.content)
```

---

## Alibaba Cloud PAI Fine-Tuning

```python
from alibabacloud_pai_dlc20201203.client import Client
from alibabacloud_tea_openapi.models import Config

# PAI fine-tuning configuration
training_job = {
    "algorithm_spec": {
        "training_image_uri": "pai-image:qwen-finetune-v1",
    },
    "input_channels": [
        {"name": "training_data", "data_source": {"oss_uri": "oss://bucket/data/"}},
        {"name": "pretrained_model", "data_source": {"oss_uri": "oss://bucket/qwen/"}},
    ],
    "output_channels": [
        {"name": "model_output", "data_source": {"oss_uri": "oss://bucket/output/"}},
    ],
    "hyper_parameters": {
        "learning_rate": 5e-5,
        "num_train_epochs": 3,
        "per_device_train_batch_size": 4,
        "lora_r": 8,
        "lora_alpha": 32,
    },
    "resource_config": {
        "ecs_spec": "ecs.gn6e-c12g1.3xlarge",  # V100 32GB
        "worker_count": 1,
    },
}

# Submit PAI job
# client.create_training_job(training_job)
```

---

## Fine-Tuning Effectiveness Evaluation

```python
def evaluate_finetune(base_model: str, finetuned_model: str, test_data: list) -> dict:
    """Compare before/after fine-tuning performance"""
    results = {"base": [], "finetuned": [], "improvement": []}

    for item in test_data:
        # Original model
        base_response = call_model(base_model, item["messages"])
        base_score = score_response(base_response, item["expected"])

        # Fine-tuned model
        ft_response = call_model(finetuned_model, item["messages"])
        ft_score = score_response(ft_response, item["expected"])

        improvement = ft_score - base_score
        results["base"].append(base_score)
        results["finetuned"].append(ft_score)
        results["improvement"].append(improvement)

    avg_base = statistics.mean(results["base"])
    avg_ft = statistics.mean(results["finetuned"])
    avg_improv = statistics.mean(results["improvement"])

    print(f"Original model avg score: {avg_base:.2f}")
    print(f"Fine-tuned model avg score: {avg_ft:.2f}")
    print(f"Average improvement: {avg_improv:+.2f} ({(avg_improv/avg_base)*100:+.1f}%)")

    return results
```

---

## Fine-Tuning Cost Estimates

| Model | Method | GPU | Data Size | Duration | Cost |
|------|------|-----|--------|------|------|
| Qwen2.5-7B | LoRA | RTX 4090 | 1000 samples | ~30 min | ¥0.9 |
| Qwen2.5-7B | LoRA | A100 | 5000 samples | ~1.5 hrs | ¥6.75 |
| Qwen2.5-14B | QLoRA | RTX 4090 | 1000 samples | ~1 hr | ¥1.8 |
| GLM-4-9B | LoRA | RTX 4090 | 2000 samples | ~40 min | ¥1.2 |
| DeepSeek-R1 | LoRA | A100 80G | 5000 samples | ~3 hrs | ¥18 |

---

## Next Steps

- [DeepSeek Fine-Tuning Guide](/tutorials/deepseek-fine-tuning-guide/)
- [AI GPU Cloud Service Comparison](/tutorials/ai-gpu-cloud-compare/)

> 📝 Based on LLaMA Factory/SWIFT/PAI/ZhipuAI, June 2026.
