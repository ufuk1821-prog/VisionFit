import modal
from fastapi import Request

MODEL_ID = "213asdfdws/visionfit-llm"

def model_indir():
    from huggingface_hub import snapshot_download
    snapshot_download(MODEL_ID)

image = (
    modal.Image.debian_slim()
    .pip_install(
        "transformers",
        "torch",
        "accelerate",
        "huggingface_hub",
        "fastapi[standard]",
        "bitsandbytes",
    )
    .run_function(
        model_indir,
        secrets=[modal.Secret.from_name("huggingface")],
    )
)

app = modal.App("visionfit-llm")

@app.cls(
    image=image,
    gpu="T4",
    timeout=120,
    scaledown_window=600,
    min_containers=0,
    secrets=[modal.Secret.from_name("huggingface")],
)
class VisionFitLLM:
    @modal.enter()
    def model_yukle(self):
        from transformers import AutoModelForCausalLM, AutoTokenizer
        import torch

        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
        self.model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float16,
            device_map="cuda",
            load_in_4bit=True,
        )
        self.model.eval()

    @modal.method()
    def yanit_uret(self, talimat: str, girdi: str) -> str:
        import torch

        mesajlar = [{"role": "user", "content": f"{talimat}\n{girdi}"}]
        girdiler = self.tokenizer.apply_chat_template(
            mesajlar,
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt",
            return_dict=True,
        ).to("cuda")

        with torch.no_grad():
            cikti = self.model.generate(
                input_ids=girdiler["input_ids"],
                attention_mask=girdiler["attention_mask"],
                max_new_tokens=120,
                do_sample=False,
                pad_token_id=self.tokenizer.eos_token_id,
                repetition_penalty=1.1,
            )
        return self.tokenizer.decode(
            cikti[0][girdiler["input_ids"].shape[1]:],
            skip_special_tokens=True
        ).strip()


@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
async def api(request: Request) -> dict:
    veri = await request.json()
    talimat = veri.get("talimat", "")
    girdi = veri.get("girdi", "")
    llm = VisionFitLLM()
    return {"yorum": await llm.yanit_uret.remote.aio(talimat, girdi)}