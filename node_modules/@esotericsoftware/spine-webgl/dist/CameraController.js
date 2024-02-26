/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated July 28, 2023. Replaces all prior versions.
 *
 * Copyright (c) 2013-2023, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software or
 * otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE
 * SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/
import { Input } from "./Input.js";
import { Vector3 } from "./Vector3.js";
export class CameraController {
    canvas;
    camera;
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;
        let cameraX = 0, cameraY = 0, cameraZoom = 0;
        let mouseX = 0, mouseY = 0;
        let lastX = 0, lastY = 0;
        let initialZoom = 0;
        new Input(canvas).addListener({
            down: (x, y) => {
                cameraX = camera.position.x;
                cameraY = camera.position.y;
                mouseX = lastX = x;
                mouseY = lastY = y;
                initialZoom = camera.zoom;
            },
            dragged: (x, y) => {
                let deltaX = x - mouseX;
                let deltaY = y - mouseY;
                let originWorld = camera.screenToWorld(new Vector3(0, 0), canvas.clientWidth, canvas.clientHeight);
                let deltaWorld = camera.screenToWorld(new Vector3(deltaX, deltaY), canvas.clientWidth, canvas.clientHeight).sub(originWorld);
                camera.position.set(cameraX - deltaWorld.x, cameraY - deltaWorld.y, 0);
                camera.update();
                lastX = x;
                lastY = y;
            },
            wheel: (delta) => {
                let zoomAmount = delta / 200 * camera.zoom;
                let newZoom = camera.zoom + zoomAmount;
                if (newZoom > 0) {
                    let x = 0, y = 0;
                    if (delta < 0) {
                        x = lastX;
                        y = lastY;
                    }
                    else {
                        let viewCenter = new Vector3(canvas.clientWidth / 2 + 15, canvas.clientHeight / 2);
                        let mouseToCenterX = lastX - viewCenter.x;
                        let mouseToCenterY = canvas.clientHeight - 1 - lastY - viewCenter.y;
                        x = viewCenter.x - mouseToCenterX;
                        y = canvas.clientHeight - 1 - viewCenter.y + mouseToCenterY;
                    }
                    let oldDistance = camera.screenToWorld(new Vector3(x, y), canvas.clientWidth, canvas.clientHeight);
                    camera.zoom = newZoom;
                    camera.update();
                    let newDistance = camera.screenToWorld(new Vector3(x, y), canvas.clientWidth, canvas.clientHeight);
                    camera.position.add(oldDistance.sub(newDistance));
                    camera.update();
                }
            },
            zoom: (initialDistance, distance) => {
                let newZoom = initialDistance / distance;
                camera.zoom = initialZoom * newZoom;
            },
            up: (x, y) => {
                lastX = x;
                lastY = y;
            },
            moved: (x, y) => {
                lastX = x;
                lastY = y;
            },
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FtZXJhQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9DYW1lcmFDb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0VBMkIrRTtBQUUvRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRW5DLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFFdkMsTUFBTSxPQUFPLGdCQUFnQjtJQUNSO0lBQTRCO0lBQWhELFlBQW9CLE1BQW1CLEVBQVMsTUFBbUI7UUFBL0MsV0FBTSxHQUFOLE1BQU0sQ0FBYTtRQUFTLFdBQU0sR0FBTixNQUFNLENBQWE7UUFDbEUsSUFBSSxPQUFPLEdBQUcsQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDLEVBQUUsVUFBVSxHQUFHLENBQUMsQ0FBQztRQUM3QyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUMzQixJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUN6QixJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFFcEIsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxDQUFDO1lBQzdCLElBQUksRUFBRSxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsRUFBRTtnQkFDOUIsT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixPQUFPLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLE1BQU0sR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQixNQUFNLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztnQkFDbkIsV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDM0IsQ0FBQztZQUNELE9BQU8sRUFBRSxDQUFDLENBQVMsRUFBRSxD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