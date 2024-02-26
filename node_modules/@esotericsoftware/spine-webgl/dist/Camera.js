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
import { Matrix4 } from "./Matrix4.js";
import { Vector3 } from "./Vector3.js";
export class OrthoCamera {
    position = new Vector3(0, 0, 0);
    direction = new Vector3(0, 0, -1);
    up = new Vector3(0, 1, 0);
    near = 0;
    far = 100;
    zoom = 1;
    viewportWidth = 0;
    viewportHeight = 0;
    projectionView = new Matrix4();
    inverseProjectionView = new Matrix4();
    projection = new Matrix4();
    view = new Matrix4();
    constructor(viewportWidth, viewportHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.update();
    }
    update() {
        let projection = this.projection;
        let view = this.view;
        let projectionView = this.projectionView;
        let inverseProjectionView = this.inverseProjectionView;
        let zoom = this.zoom, viewportWidth = this.viewportWidth, viewportHeight = this.viewportHeight;
        projection.ortho(zoom * (-viewportWidth / 2), zoom * (viewportWidth / 2), zoom * (-viewportHeight / 2), zoom * (viewportHeight / 2), this.near, this.far);
        view.lookAt(this.position, this.direction, this.up);
        projectionView.set(projection.values);
        projectionView.multiply(view);
        inverseProjectionView.set(projectionView.values).invert();
    }
    screenToWorld(screenCoords, screenWidth, screenHeight) {
        let x = screenCoords.x, y = screenHeight - screenCoords.y - 1;
        screenCoords.x = (2 * x) / screenWidth - 1;
        screenCoords.y = (2 * y) / screenHeight - 1;
        screenCoords.z = (2 * screenCoords.z) - 1;
        screenCoords.project(this.inverseProjectionView);
        return screenCoords;
    }
    worldToScreen(worldCoords, screenWidth, screenHeight) {
        worldCoords.project(this.projectionView);
        worldCoords.x = screenWidth * (worldCoords.x + 1) / 2;
        worldCoords.y = screenHeight * (worldCoords.y + 1) / 2;
        worldCoords.z = (worldCoords.z + 1) / 2;
        return worldCoords;
    }
    setViewport(viewportWidth, viewportHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FtZXJhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0NhbWVyYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytFQTJCK0U7QUFFL0UsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUN2QyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBRXZDLE1BQU0sT0FBTyxXQUFXO0lBQ3ZCLFFBQVEsR0FBRyxJQUFJLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLFNBQVMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEMsRUFBRSxHQUFHLElBQUksT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDMUIsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNULEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDVixJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ1QsYUFBYSxHQUFHLENBQUMsQ0FBQztJQUNsQixjQUFjLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLGNBQWMsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0lBQy9CLHFCQUFxQixHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7SUFDdEMsVUFBVSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7SUFDM0IsSUFBSSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7SUFFckIsWUFBYSxhQUFxQixFQUFFLGNBQXNCO1FBQ3pELElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1FBQ25DLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNmLENBQUM7SUFFRCxNQUFNO1FBQ0wsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFD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