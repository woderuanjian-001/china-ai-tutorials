---
title: "LLaMA-Factory Fine-Tuning Guide: Zero-Code Fine-Tuning for Chinese LLMs"
description: "Complete LLaMA-Factory fine-tuning tutorial: Web UI zero-code fine-tuning, LoRA/QLoRA, dataset preparation, export and deployment. Supports full-pipeline fine-tuning for Chinese models like DeepSeek, Qwen, and GLM."
category: "Advanced Models"
date: 2026-06-20
tags: ["Fine-Tuning", "LLaMA-Factory", "LoRA", "QLoRA", "Open Source", "Advanced"]
level: "Advanced"
---

## What This Tutorial Solves

You will use LLaMA-Factory to fine-tune all major Chinese LLMs:

- Zero-code Web UI fine-tuning
- LoRA/QLoRA efficient fine-tuning
- Custom dataset preparation
- Model export and deployment

> 🎯 LLaMA-Factory is the world's most popular open-source fine-tuning framework (GitHub 45K+ stars). It supports 100+ models, including all major Chinese LLMs.

---

## Installation and Launch

```bash
# 1. Clone the project
git clone https://github.com/hiyouga/LLaMA-Factory.git
cd LLaMA-Factory

# 2. Install dependencies
pip install -e ".[torch,metrics]"

# 3. Launch Web UI (zero-code fine-tuning)
llamafactory-cli webui

# Visit http://localhost:7860
```

---

## Dataset Preparation

```python
# Prepare fine-tuning data -- Alpaca format
import json

# Example: Customer service conversation fine-tuning data
training_data = [
    {
        "instruction": "你是电商客服。用户询问退货政策时，礼貌地回答。",
        "input": "我买的衣服不合身，可以退货吗？",
        "output": "您好！我们支持7天无理由退货。只要商品标签完好、未洗涤、不影响二次销售，您可以在收货后7天内申请退货。请问需要我帮您操作吗？"
    },
    {
        "instruction": "你是电商客服。用户询问退货政策时，礼貌地回答。",
        "input": "退货的运费谁出？",
        "output": "您好！如果是商品质量问题，我们承担来回运费。如果是个人原因（如尺码不合适），需要您承担寄回运费哦。不过别担心，我们合作的快递可以享受优惠价格。"
    },
    {
        "instruction": "你是电商客服。用户询问退货政策时，礼貌地回答。",
        "input": "退货后多久能收到退款？",
        "output": "您好！我们收到退货商品后1-2个工作日内完成质检，通过后立即发起退款。支付宝/微信通常即时到账，银行卡可能需要1-3个工作日。您放心，我们会尽快处理的！"
    },
]

# Save as JSON file
with open("customer_service_data.json", "w", encoding="utf-8") as f:
    json.dump(training_data, f, ensure_ascii=False, indent=2)

print(f"✅ Generated {len(training_data)} training samples")

# Register in dataset_info.json
dataset_config = {
    "customer_service": {
        "file_name": "customer_service_data.json",
        "columns": {
            "prompt": "instruction",
            "query": "input",
            "response": "output",
        },
    }
}
```

---

## Python Code Fine-Tuning

```python
# Fine-tune with pure Python code, no Web UI needed
from llamafactory import Launcher

# Method 1: Using command-line arguments
launcher = Launcher()
launcher.launch([
    "--model_name_or_path", "deepseek-ai/DeepSeek-V3",
    "--template", "deepseek",
    "--dataset", "customer_service",
    "--output_dir", "./output/deepseek-cs-lora",
    "--finetuning_type", "lora",
    "--lora_rank", "8",
    "--lora_alpha", "16",
    "--lora_target", "q_proj,v_proj",
    "--per_device_train_batch_size", "2",
    "--gradient_accumulation_steps", "4",
    "--learning_rate", "5e-5",
    "--num_train_epochs", "3",
    "--lr_scheduler_type", "cosine",
    "--warmup_ratio", "0.1",
    "--logging_steps", "10",
    "--save_steps", "100",
    "--fp16",
])
```

---

## LoRA Fine-Tuning Configuration Explained

```yaml
# Configuration file: train_config.yaml
### Model config
model_name_or_path: Qwen/Qwen2.5-7B-Instruct  # Base model
template: qwen                                   # Chat template
trust_remote_code: true                         # Enable custom code

### Fine-tuning method
finetuning_type: lora     # lora / full / freeze
lora_rank: 8              # LoRA rank (higher = stronger but slower)
lora_alpha: 16            # LoRA scaling factor
lora_target: all          # Target layers (all = all linear layers)
lora_dropout: 0.1         # LoRA dropout
use_rslora: true          # RS-LoRA (more stable)

### QLoRA (when VRAM is limited)
# quantization_bit: 4     # 4-bit quantization
# double_quantization: true

### Dataset
dataset: customer_service,alpaca_zh  # Can use multiple
cutoff_len: 2048                     # Truncation length
preprocessing_num_workers: 4         # Parallel preprocessing workers

### Training
output_dir: ./output/qwen-cs-lora
per_device_train_batch_size: 2
gradient_accumulation_steps: 4
learning_rate: 5.0e-5
num_train_epochs: 3.0
lr_scheduler_type: cosine
warmup_ratio: 0.1
logging_steps: 10
save_steps: 500
eval_steps: 500
save_total_limit: 3

### Performance optimization
fp16: true                # Mixed precision
gradient_checkpointing: true  # Save VRAM
dataloader_num_workers: 4

### Evaluation
val_size: 0.1             # Validation set ratio
per_device_eval_batch_size: 2
load_best_model_at_end: true
metric_for_best_model: loss
```

---

## Chinese Model Fine-Tuning Quick Reference

```python
# Chinese models and templates supported by LLaMA-Factory
CHINESE_MODEL_TEMPLATES = {
    "deepseek": {
        "model": "deepseek-ai/DeepSeek-V3",
        "template": "deepseek",
        "note": "Use 'deepseek3' template; tokenizer requires special handling",
    },
    "qwen": {
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "template": "qwen",
        "note": "The most widely used Chinese open-source model",
    },
    "glm": {
        "model": "THUDM/glm-4-9b-chat",
        "template": "glm4",
        "note": "Note GLM's special tokenizer",
    },
    "kimi": {
        "model": "moonshotai/Kimi-K2-Instruct",
        "template": "kimi",
        "note": "API access only",
    },
    "yi": {
        "model": "01-ai/Yi-1.5-9B-Chat",
        "template": "yi",
        "note": "01.AI open-source model",
    },
    "baichuan": {
        "model": "baichuan-inc/Baichuan2-13B-Chat",
        "template": "baichuan2",
        "note": "Baichuan Intelligence open-source model",
    },
    "internlm": {
        "model": "internlm/internlm2-chat-7b",
        "template": "intern",
        "note": "Shanghai AI Laboratory",
    },
}

# Example: Fine-tune Qwen 2.5
def fine_tune_qwen():
    """Fine-tune Qwen model"""
    launcher = Launcher()
    launcher.launch([
        "--model_name_or_path", "Qwen/Qwen2.5-7B-Instruct",
        "--template", "qwen",
        "--dataset", "customer_service",
        "--output_dir", "./output/qwen-cs-v1",
        "--finetuning_type", "lora",
        "--lora_rank", "16",
        "--lora_target", "all",
        "--per_device_train_batch_size", "2",
        "--gradient_accumulation_steps", "4",
        "--learning_rate", "1e-4",
        "--num_train_epochs", "5",
        "--fp16",
    ])
```

---

## Export and Deployment

```python
# 1. Export merged model
def export_model(lora_path: str, base_model: str, export_dir: str):
    """Merge LoRA weights into the base model and export"""
    launcher = Launcher()
    launcher.launch([
        "--model_name_or_path", base_model,
        "--adapter_name_or_path", lora_path,
        "--template", "qwen",
        "--finetuning_type", "lora",
        "--export_dir", export_dir,
        "--export_size", "2",   # 2GB per shard
        "--export_device", "cpu",
        "--export_legacy_format", "false",
    ])

# 2. Deploy with vLLM
def deploy_with_vllm(model_path: str):
    """Deploy the fine-tuned model with vLLM"""
    import subprocess

    subprocess.run([
        "python", "-m", "vllm.entrypoints.openai.api_server",
        "--model", model_path,
        "--served-model-name", "my-fine-tuned-model",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--max-model-len", "4096",
        "--gpu-memory-utilization", "0.9",
    ])

# 3. Deploy with Ollama
def deploy_with_ollama(model_path: str, model_name: str = "my-model"):
    """Deploy with Ollama (requires conversion to GGUF first)"""
    # 1. Convert to GGUF
    # python convert_hf_to_gguf.py {model_path} --outtype f16

    # 2. Create Modelfile
    modelfile = f"""
FROM {model_path}/ggml-model-f16.gguf
TEMPLATE \"\"\"{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
{{ end }}<|im_start|>assistant
\"\"\"
PARAMETER temperature 0.7
PARAMETER top_p 0.8
"""
    with open("Modelfile", "w") as f:
        f.write(modelfile)

    # 3. Create Ollama model
    subprocess.run(["ollama", "create", model_name, "-f", "Modelfile"])
    print(f"✅ Ollama model created: {model_name}")
    print(f"Run: ollama run {model_name}")
```

---

## Fine-Tuning Effectiveness Evaluation

```python
class FineTuneEvaluator:
    """Evaluate fine-tuning effectiveness"""

    def __init__(self, base_model: str, fine_tuned_model: str):
        self.base_model = base_model
        self.fine_tuned_model = fine_tuned_model
        self.client = client

    def side_by_side_compare(self, test_cases: list[str]) -> list[dict]:
        """Side-by-side comparison before and after fine-tuning"""
        results = []

        for i, test in enumerate(test_cases):
            # Original model
            base_response = self.client.chat.completions.create(
                model="deepseek-v4-pro",
                messages=[{"role": "user", "content": test}],
                temperature=0.3,
            )

            # Fine-tuned model (assuming API call)
            ft_response = self.client.chat.completions.create(
                model="deepseek-v4-pro",
                messages=[
                    {"role": "system", "content": "你是电商客服，亲切专业地回答问题。"},
                    {"role": "user", "content": test},
                ],
                temperature=0.3,
            )

            results.append({
                "test": test,
                "base": base_response.choices[0].message.content,
                "fine_tuned": ft_response.choices[0].message.content,
            })

        return results

# Usage
evaluator = FineTuneEvaluator("deepseek-v4-pro", "my-cs-model")
# comparisons = evaluator.side_by_side_compare([
#     "能退货吗？",
#     "你们发货太慢了！",
# ])
```

---

## Fine-Tuning vs RAG: Selection Guide

| Dimension | Fine-Tuning | RAG |
|-----------|-------------|-----|
| Best for | Style/format/tone | Knowledge/facts |
| Data volume | Thousands to tens of thousands | Any amount |
| Cost | High (GPU) | Low |
| Timeliness | Requires retraining | Instant doc updates |
| Hallucination control | Requires data cleaning | Cites sources, traceable |
| Typical use case | CS tone, classifiers | Enterprise knowledge base Q&A |

---

## Next Steps

- [AI Fine-Tuning Platform Comparison](/tutorials/ai-fine-tuning-platforms-compare/)
- [RAG Getting Started Tutorial](/tutorials/rag-chinese-ai-models-guide/)

> 📝 Based on LLaMA-Factory 0.9+, June 2026.
