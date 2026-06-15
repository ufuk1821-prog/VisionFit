import os
from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="213asdfdws/visionfit-llm",
    local_dir="visionfit_llm",
    token=os.environ["HF_TOKEN"],
)

print("Model indirildi: visionfit_llm")