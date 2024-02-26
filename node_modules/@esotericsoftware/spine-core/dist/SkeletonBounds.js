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
import { BoundingBoxAttachment } from "./attachments/BoundingBoxAttachment.js";
import { Pool, Utils } from "./Utils.js";
/** Collects each visible {@link BoundingBoxAttachment} and computes the world vertices for its polygon. The polygon vertices are
 * provided along with convenience methods for doing hit detection. */
export class SkeletonBounds {
    /** The left edge of the axis aligned bounding box. */
    minX = 0;
    /** The bottom edge of the axis aligned bounding box. */
    minY = 0;
    /** The right edge of the axis aligned bounding box. */
    maxX = 0;
    /** The top edge of the axis aligned bounding box. */
    maxY = 0;
    /** The visible bounding boxes. */
    boundingBoxes = new Array();
    /** The world vertices for the bounding box polygons. */
    polygons = new Array();
    polygonPool = new Pool(() => {
        return Utils.newFloatArray(16);
    });
    /** Clears any previous polygons, finds all visible bounding box attachments, and computes the world vertices for each bounding
     * box's polygon.
     * @param updateAabb If true, the axis aligned bounding box containing all the polygons is computed. If false, the
     *           SkeletonBounds AABB methods will always return true. */
    update(skeleton, updateAabb) {
        if (!skeleton)
            throw new Error("skeleton cannot be null.");
        let boundingBoxes = this.boundingBoxes;
        let polygons = this.polygons;
        let polygonPool = this.polygonPool;
        let slots = skeleton.slots;
        let slotCount = slots.length;
        boundingBoxes.length = 0;
        polygonPool.freeAll(polygons);
        polygons.length = 0;
        for (let i = 0; i < slotCount; i++) {
            let slot = slots[i];
            if (!slot.bone.active)
                continue;
            let attachment = slot.getAttachment();
            if (attachment instanceof BoundingBoxAttachment) {
                let boundingBox = attachment;
                boundingBoxes.push(boundingBox);
                let polygon = polygonPool.obtain();
                if (polygon.length != boundingBox.worldVerticesLength) {
                    polygon = Utils.newFloatArray(boundingBox.worldVerticesLength);
                }
                polygons.push(polygon);
                boundingBox.computeWorldVertices(slot, 0, boundingBox.worldVerticesLength, polygon, 0, 2);
            }
        }
        if (updateAabb) {
            this.aabbCompute();
        }
        else {
            this.minX = Number.POSITIVE_INFINITY;
            this.minY = Number.POSITIVE_INFINITY;
            this.maxX = Number.NEGATIVE_INFINITY;
            this.maxY = Number.NEGATIVE_INFINITY;
        }
    }
    aabbCompute() {
        let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
        let polygons = this.polygons;
        for (let i = 0, n = polygons.length; i < n; i++) {
            let polygon = polygons[i];
            let vertices = polygon;
            for (let ii = 0, nn = polygon.length; ii < nn; ii += 2) {
                let x = vertices[ii];
                let y = vertices[ii + 1];
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }
    /** Returns true if the axis aligned bounding box contains the point. */
    aabbContainsPoint(x, y) {
        return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
    }
    /** Returns true if the axis aligned bounding box intersects the line segment. */
    aabbIntersectsSegment(x1, y1, x2, y2) {
        let minX = this.minX;
        let minY = this.minY;
        let maxX = this.maxX;
        let maxY = this.maxY;
        if ((x1 <= minX && x2 <= minX) || (y1 <= minY && y2 <= minY) || (x1 >= maxX && x2 >= maxX) || (y1 >= maxY && y2 >= maxY))
            return false;
        let m = (y2 - y1) / (x2 - x1);
        let y = m * (minX - x1) + y1;
        if (y > minY && y < maxY)
            return true;
        y = m * (maxX - x1) + y1;
        if (y > minY && y < maxY)
            return true;
        let x = (minY - y1) / m + x1;
        if (x > minX && x < maxX)
            return true;
        x = (maxY - y1) / m + x1;
        if (x > minX && x < maxX)
            return true;
        return false;
    }
    /** Returns true if the axis aligned bounding box intersects the axis aligned bounding box of the specified bounds. */
    aabbIntersectsSkeleton(bounds) {
        return this.minX < bounds.maxX && this.maxX > bounds.minX && this.minY < bounds.maxY && this.maxY > bounds.minY;
    }
    /** Returns the first bounding box attachment that contains the point, or null. When doing many checks, it is usually more
     * efficient to only call this method if {@link #aabbContainsPoint(float, float)} returns true. */
    containsPoint(x, y) {
        let polygons = this.polygons;
        for (let i = 0, n = polygons.length; i < n; i++)
            if (this.containsPointPolygon(polygons[i], x, y))
                return this.boundingBoxes[i];
        return null;
    }
    /** Returns true if the polygon contains the point. */
    containsPointPolygon(polygon, x, y) {
        let vertices = polygon;
        let nn = polygon.length;
        let prevIndex = nn - 2;
        let inside = false;
        for (let ii = 0; ii < nn; ii += 2) {
            let vertexY = vertices[ii + 1];
            let prevY = vertices[prevIndex + 1];
            if ((vertexY < y && prevY >= y) || (prevY < y && vertexY >= y)) {
                let vertexX = vertices[ii];
                if (vertexX + (y - vertexY) / (prevY - vertexY) * (vertices[prevIndex] - vertexX) < x)
                    inside = !inside;
            }
            prevIndex = ii;
        }
        return inside;
    }
    /** Returns the first bounding box attachment that contains any part of the line segment, or null. When doing many checks, it
     * is usually more efficient to only call this method if {@link #aabbIntersectsSegment()} returns
     * true. */
    intersectsSegment(x1, y1, x2, y2) {
        let polygons = this.polygons;
        for (let i = 0, n = polygons.length; i < n; i++)
            if (this.intersectsSegmentPolygon(polygons[i], x1, y1, x2, y2))
                return this.boundingBoxes[i];
        return null;
    }
    /** Returns true if the polygon contains any part of the line segment. */
    intersectsSegmentPolygon(polygon, x1, y1, x2, y2) {
        let vertices = polygon;
        let nn = polygon.length;
        let width12 = x1 - x2, height12 = y1 - y2;
        let det1 = x1 * y2 - y1 * x2;
        let x3 = vertices[nn - 2], y3 = vertices[nn - 1];
        for (let ii = 0; ii < nn; ii += 2) {
            let x4 = vertices[ii], y4 = vertices[ii + 1];
            let det2 = x3 * y4 - y3 * x4;
            let width34 = x3 - x4, height34 = y3 - y4;
            let det3 = width12 * height34 - height12 * width34;
            let x = (det1 * width34 - width12 * det2) / det3;
            if (((x >= x3 && x <= x4) || (x >= x4 && x <= x3)) && ((x >= x1 && x <= x2) || (x >= x2 && x <= x1))) {
                let y = (det1 * height34 - height12 * det2) / det3;
                if (((y >= y3 && y <= y4) || (y >= y4 && y <= y3)) && ((y >= y1 && y <= y2) || (y >= y2 && y <= y1)))
                    return true;
            }
            x3 = x4;
            y3 = y4;
        }
        return false;
    }
    /** Returns the polygon for the specified bounding box, or null. */
    getPolygon(boundingBox) {
        if (!boundingBox)
            throw new Error("boundingBox cannot be null.");
        let index = this.boundingBoxes.indexOf(boundingBox);
        return index == -1 ? null : this.polygons[index];
    }
    /** The width of the axis aligned bounding box. */
    getWidth() {
        return this.maxX - this.minX;
    }
    /** The height of the axis aligned bounding box. */
    getHeight() {
        return this.maxY - this.minY;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2tlbGV0b25Cb3VuZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvU2tlbGV0b25Cb3VuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRS9FLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBRS9FLE9BQU8sRUFBbUIsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLFlBQVksQ0FBQztBQUUxRDtzRUFDc0U7QUFDdEUsTUFBTSxPQUFPLGNBQWM7SUFFMUIsc0RBQXNEO0lBQ3RELElBQUksR0FBRyxDQUFDLENBQUM7SUFFVCx3REFBd0Q7SUFDeEQsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUVULHVEQUF1RDtJQUN2RCxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBRVQscURBQXFEO0lBQ3JELElBQUksR0FBRyxDQUFDLENBQUM7SUFFVCxrQ0FBa0M7SUFDbEMsYUFBYSxHQUFHLElBQUksS0FBSyxFQUF5QixDQUFDO0lBRW5ELHdEQUF3RDtJQUN4RCxRQUFRLEdBQUcsSUFBSSxLQUFLLEVBQW1CLENBQUM7SUFFaEMsV0FBVyxHQUFHLElBQUksSUFBSSxDQUFrQixHQUFHLEVBQUU7UUFDcEQsT0FBTyxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxDQUFDO0lBRUg7Ozt3RUFHb0U7SUFDcEUsTUFBTSxDQUFFLFFBQWtCLEVBQUUsVUFBbUI7UUFDOUMsSUFBSSxDQUFDLFFBQVE7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDM0QsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUN2QyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQzdCLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDbkMsSUFBSSxLQUFLLEdB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QUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxRQUFRLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ2pELEtBQUssSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTtZQUNsQyxJQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDN0MsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQzdCLElBQUksT0FBTyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsUUFBUSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDMUMsSUFBSSxJQUFJLEdBQUcsT0FBTyxHQUFHLFFBQVEsR0FBRyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ25ELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQ2pELElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUNyRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxRQUFRLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDbkQsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUFFLE9BQU8sSUFBSSxDQUFDO2FBQ2xIO1lBQ0QsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUNSLEVBQUUsR0FBRyxFQUFFLENBQUM7U0FDUjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELG1FQUFtRTtJQUNuRSxVQUFVLENBQUUsV0FBa0M7UUFDN0MsSUFBSSxDQUFDLFdBQVc7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFDakUsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEQsT0FBTyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsa0RBQWtEO0lBQ2xELFFBQVE7UUFDUCxPQUFPLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztJQUM5QixDQUFDO0lBRUQsbURBQW1EO0lBQ25ELFNBQVM7UUFDUixPQUFPLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztJQUM5QixDQUFDO0NBQ0QifQ==