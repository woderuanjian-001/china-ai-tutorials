---
title: "3D Content Generation with Chinese AI Models: Text-to-3D, Image-to-3D & Scene Reconstruction Using Hunyuan3D"
description: "Generate 3D content with Chinese AI models: text-to-3D model conversion, image-to-3D reconstruction, and AI texture generation. Complete API integration guide for Meshy, VAST, and Tencent Hunyuan3D with Three.js visualization using Chinese AI pipelines."
category: "Advanced Models"
date: 2026-06-27
tags: ["3D", "Modeling", "Texture", "Meshy", "VAST", "Advanced"]
level: "Advanced"
---

## What Problem Does This Tutorial Solve?

You will generate 3D content using AI:

- Text description to 3D model generation
- Single image to 3D reconstruction
- AI auto texture generation
- 3D model display on the web

> A "medieval knight's sword" to AI-generated textured 3D model in 30 seconds. A productivity revolution for game developers.

---

## Meshy AI 3D Generation

```python
import requests
import os
import time

class Meshy3D:
    """Meshy AI 3D Model Generation API"""

    BASE_URL = "https://api.meshy.ai/v2"

    def __init__(self):
        self.api_key = os.getenv("MESHY_API_KEY")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def text_to_3d(
        self,
        prompt: str,
        style: str = "realistic",
        wait_for_result: bool = True,
    ) -> dict:
        """Text to 3D model"""
        # 1. Submit generation task
        response = requests.post(
            f"{self.BASE_URL}/text-to-3d",
            headers=self.headers,
            json={
                "prompt": prompt,
                "style": style,  # realistic / cartoon / low-poly
                "negative_prompt": "blurry, low quality, distorted",
            },
        )

        task_id = response.json()["id"]
        print(f"Task submitted: {task_id}")

        if not wait_for_result:
            return {"task_id": task_id, "status": "processing"}

        # 2. Poll for results
        return self._wait_for_completion(task_id)

    def image_to_3d(self, image_url: str) -> dict:
        """Image to 3D model"""
        response = requests.post(
            f"{self.BASE_URL}/image-to-3d",
            headers=self.headers,
            json={"image_url": image_url},
        )

        task_id = response.json()["id"]
        return self._wait_for_completion(task_id)

    def _wait_for_completion(self, task_id: str, timeout: int = 300) -> dict:
        """Wait for generation to complete"""
        start_time = time.time()

        while time.time() - start_time < timeout:
            response = requests.get(
                f"{self.BASE_URL}/tasks/{task_id}",
                headers=self.headers,
            )

            task = response.json()

            if task["status"] == "SUCCEEDED":
                print(f"3D model generated successfully")
                return {
                    "task_id": task_id,
                    "glb_url": task.get("model_urls", {}).get("glb"),
                    "fbx_url": task.get("model_urls", {}).get("fbx"),
                    "obj_url": task.get("model_urls", {}).get("obj"),
                    "preview_url": task.get("thumbnail_url"),
                    "polygons": task.get("polygon_count"),
                }

            elif task["status"] == "FAILED":
                print(f"Generation failed: {task.get('error', 'Unknown error')}")
                return {"task_id": task_id, "status": "failed"}

            status = task.get("progress", 0)
            print(f"Generating... {status}%")
            time.sleep(5)

        return {"task_id": task_id, "status": "timeout"}

    def generate_texture(
        self,
        model_url: str,
        prompt: str,
    ) -> dict:
        """AI generated model texture"""
        response = requests.post(
            f"{self.BASE_URL}/text-to-texture",
            headers=self.headers,
            json={
                "model_url": model_url,
                "texture_prompt": prompt,
            },
        )

        task_id = response.json()["id"]
        return self._wait_for_completion(task_id)

# Usage
meshy = Meshy3D()

# Text to 3D
result = meshy.text_to_3d(
    "A finely forged medieval knight's sword with a ruby-encrusted hilt, metallic finish",
    style="realistic",
)
print(f"GLB Model: {result.get('glb_url', '?')}")
print(f"Polygon Count: {result.get('polygons', '?')}")
```

---

## Tencent Hunyuan3D

```python
class Hunyuan3D:
    """Tencent Hunyuan3D — Image-to-3D"""

    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("HUNYUAN_API_KEY"),
            base_url="https://api.hunyuan.cloud.tencent.com/v1",
        )

    def image_to_3d(self, image_base64: str) -> dict:
        """Image to 3D conversion"""
        response = self.client.chat.completions.create(
            model="hunyuan-3d",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Convert this image to a 3D model"},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
                    ],
                }
            ],
        )
        return {"result": response.choices[0].message.content}

    def text_to_3d_preview(self, prompt: str) -> str:
        """Text preview of 3D model"""
        response = self.client.chat.completions.create(
            model="hunyuan-turbos-vision",
            messages=[
                {
                    "role": "user",
                    "content": f"Display this 3D object from multiple angles: {prompt}. Generate a four-view layout (front, side, top, 45-degree angle).",
                }
            ],
        )
        return response.choices[0].message.content
```

---

## 3D Model Optimization

```python
import trimesh
import numpy as np

class ModelOptimizer:
    """3D model optimization — prepare for Web/Mobile"""

    def optimize_for_web(self, input_path: str, target_faces: int = 10000) -> str:
        """Optimize to web-appropriate size"""
        mesh = trimesh.load(input_path)

        # 1. Decimation
        if len(mesh.faces) > target_faces:
            ratio = target_faces / len(mesh.faces)
            mesh = mesh.simplify_quadratic_decimation(int(len(mesh.faces) * ratio))
            print(f"Decimated: {len(mesh.faces)} to {target_faces} faces")

        # 2. Center
        mesh.vertices -= mesh.centroid

        # 3. Scale to unit size
        scale = 1.0 / max(mesh.extents)
        mesh.vertices *= scale

        # 4. Fix normals
        mesh.fix_normals()

        # 5. Export GLB
        output_path = input_path.replace(".obj", "_optimized.glb")
        mesh.export(output_path)

        file_size_kb = os.path.getsize(output_path) / 1024
        print(f"Optimization complete: {output_path} ({file_size_kb:.0f}KB)")
        return output_path

    def auto_lod(self, input_path: str, levels: int = 3) -> list[str]:
        """Auto-generate LOD (Level of Detail)"""
        mesh = trimesh.load(input_path)
        lod_files = []

        for level in range(levels):
            # Reduce faces by ~60% per level
            if level > 0:
                ratio = 0.4 ** level
                mesh = mesh.simplify_quadratic_decimation(
                    int(len(mesh.faces) * ratio)
                )

            output_path = input_path.replace(".obj", f"_LOD{level}.glb")
            mesh.export(output_path)
            lod_files.append(output_path)

            faces = len(mesh.faces)
            size = os.path.getsize(output_path) / 1024
            print(f"  LOD{level}: {faces} faces, {size:.0f}KB")

        return lod_files

# Usage
optimizer = ModelOptimizer()
# optimizer.optimize_for_web("sword.obj", target_faces=5000)
# optimizer.auto_lod("sword.obj", levels=3)
```

---

## Three.js Web Display

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <title>AI 3D Model Viewer</title>
    <style>
        body { margin: 0; overflow: hidden; background: #0d0d14; }
        canvas { display: block; }
        .controls {
            position: fixed; bottom: 20px; left: 50%;
            transform: translateX(-50%);
            display: flex; gap: 12px;
        }
        .controls button {
            padding: 12px 24px;
            background: #e8563a;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
        }
        .controls button:hover { background: #c4452e; }
    </style>
</head>
<body>
    <div class="controls">
        <button onclick="resetView()">Reset View</button>
        <button onclick="toggleWireframe()">Wireframe Mode</button>
        <button onclick="toggleAutoRotate()">Auto Rotate</button>
    </div>

    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
    }
    </script>

    <script type="module">
        import * as THREE from "three";
        import { OrbitControls } from "three/addons/controls/OrbitControls.js";
        import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d0d14);

        // Camera
        const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
        camera.position.set(3, 2, 5);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(innerWidth, innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        document.body.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 3);
        keyLight.position.set(5, 8, 5);
        keyLight.castShadow = true;
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xe8563a, 1.5);
        rimLight.position.set(-3, 2, -3);
        scene.add(rimLight);

        const fillLight = new THREE.DirectionalLight(0x4ecdc4, 1);
        fillLight.position.set(0, 1, 3);
        scene.add(fillLight);

        // Ground reflection
        const groundGeo = new THREE.PlaneGeometry(10, 10);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.4,
            metalness: 0.3,
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1.5;
        ground.receiveShadow = true;
        scene.add(ground);

        // Orbit controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.5;

        // Load AI-generated GLB model
        const loader = new GLTFLoader();
        let model;

        // Replace with the GLB URL returned by the Meshy API
        loader.load("https://assets.meshy.ai/example-model.glb", (gltf) => {
            model = gltf.scene;
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            scene.add(model);
        });

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        // Control functions
        window.resetView = () => {
            camera.position.set(3, 2, 5);
            controls.target.set(0, 0, 0);
            controls.update();
        };

        window.toggleWireframe = () => {
            if (!model) return;
            model.traverse((node) => {
                if (node.isMesh) node.material.wireframe = !node.material.wireframe;
            });
        };

        window.toggleAutoRotate = () => {
            controls.autoRotate = !controls.autoRotate;
        };
    </script>
</body>
</html>
```

---

## AI 3D Tool Comparison

| Tool | Type | Strengths | Output Format |
|------|------|------|---------|
| **Meshy** | International / Available in China | Text+Image to 3D | GLB/FBX/OBJ |
| **VAST (Tripo)** | China native | Fast, free quota available | GLB/OBJ |
| **Tencent Hunyuan3D** | Major Chinese platform | Strong ecosystem integration | Proprietary format |
| **CSM** | International | High-precision reconstruction | GLB/USDZ |
| **Luma Genie** | International | Mobile-friendly | GLB/USDZ |

---

## Next Steps

- [AI Game Development](/tutorials/ai-game-development-guide/)
- [AI Image Generation](/tutorials/ai-image-generation-china-guide/)

> Based on Meshy/VAST/Hunyuan3D + Three.js, June 2026.
