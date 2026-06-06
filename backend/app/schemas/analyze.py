from pydantic import BaseModel
from typing import List

class PoseData(BaseModel):
    landmarks: List[float]