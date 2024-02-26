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
import { Color, SkeletonClipping, Vector2, Utils, RegionAttachment, MeshAttachment, ClippingAttachment } from "@esotericsoftware/spine-core";
class Renderable {
    vertices;
    numVertices;
    numFloats;
    constructor(vertices, numVertices, numFloats) {
        this.vertices = vertices;
        this.numVertices = numVertices;
        this.numFloats = numFloats;
    }
}
;
export class SkeletonRenderer {
    static QUAD_TRIANGLES = [0, 1, 2, 2, 3, 0];
    premultipliedAlpha = false;
    tempColor = new Color();
    tempColor2 = new Color();
    vertices;
    vertexSize = 2 + 2 + 4;
    twoColorTint = false;
    renderable = new Renderable([], 0, 0);
    clipper = new SkeletonClipping();
    temp = new Vector2();
    temp2 = new Vector2();
    temp3 = new Color();
    temp4 = new Color();
    constructor(context, twoColorTint = true) {
        this.twoColorTint = twoColorTint;
        if (twoColorTint)
            this.vertexSize += 4;
        this.vertices = Utils.newFloatArray(this.vertexSize * 1024);
    }
    draw(batcher, skeleton, slotRangeStart = -1, slotRangeEnd = -1, transformer = null) {
        let clipper = this.clipper;
        let premultipliedAlpha = this.premultipliedAlpha;
        let twoColorTint = this.twoColorTint;
        let blendMode = null;
        let renderable = this.renderable;
        let uvs;
        let triangles;
        let drawOrder = skeleton.drawOrder;
        let attachmentColor;
        let skeletonColor = skeleton.color;
        let vertexSize = twoColorTint ? 12 : 8;
        let inRange = false;
        if (slotRangeStart == -1)
            inRange = true;
        for (let i = 0, n = drawOrder.length; i < n; i++) {
            let clippedVertexSize = clipper.isClipping() ? 2 : vertexSize;
            let slot = drawOrder[i];
            if (!slot.bone.active) {
                clipper.clipEndWithSlot(slot);
                continue;
            }
            if (slotRangeStart >= 0 && slotRangeStart == slot.data.index) {
                inRange = true;
            }
            if (!inRange) {
                clipper.clipEndWithSlot(slot);
                continue;
            }
            if (slotRangeEnd >= 0 && slotRangeEnd == slot.data.index) {
                inRange = false;
            }
            let attachment = slot.getAttachment();
            let texture;
            if (attachment instanceof RegionAttachment) {
                let region = attachment;
                renderable.vertices = this.vertices;
                renderable.numVertices = 4;
                renderable.numFloats = clippedVertexSize << 2;
                region.computeWorldVertices(slot, renderable.vertices, 0, clippedVertexSize);
                triangles = SkeletonRenderer.QUAD_TRIANGLES;
                uvs = region.uvs;
                texture = region.region.texture;
                attachmentColor = region.color;
            }
            else if (attachment instanceof MeshAttachment) {
                let mesh = attachment;
                renderable.vertices = this.vertices;
                renderable.numVertices = (mesh.worldVerticesLength >> 1);
                renderable.numFloats = renderable.numVertices * clippedVertexSize;
                if (renderable.numFloats > renderable.vertices.length) {
                    renderable.vertices = this.vertices = Utils.newFloatArray(renderable.numFloats);
                }
                mesh.computeWorldVertices(slot, 0, mesh.worldVerticesLength, renderable.vertices, 0, clippedVertexSize);
                triangles = mesh.triangles;
                texture = mesh.region.texture;
                uvs = mesh.uvs;
                attachmentColor = mesh.color;
            }
            else if (attachment instanceof ClippingAttachment) {
                let clip = (attachment);
                clipper.clipStart(slot, clip);
                continue;
            }
            else {
                clipper.clipEndWithSlot(slot);
                continue;
            }
            if (texture) {
                let slotColor = slot.color;
                let finalColor = this.tempColor;
                finalColor.r = skeletonColor.r * slotColor.r * attachmentColor.r;
                finalColor.g = skeletonColor.g * slotColor.g * attachmentColor.g;
                finalColor.b = skeletonColor.b * slotColor.b * attachmentColor.b;
                finalColor.a = skeletonColor.a * slotColor.a * attachmentColor.a;
                if (premultipliedAlpha) {
                    finalColor.r *= finalColor.a;
                    finalColor.g *= finalColor.a;
                    finalColor.b *= finalColor.a;
                }
                let darkColor = this.tempColor2;
                if (!slot.darkColor)
                    darkColor.set(0, 0, 0, 1.0);
                else {
                    if (premultipliedAlpha) {
                        darkColor.r = slot.darkColor.r * finalColor.a;
                        darkColor.g = slot.darkColor.g * finalColor.a;
                        darkColor.b = slot.darkColor.b * finalColor.a;
                    }
                    else {
                        darkColor.setFromColor(slot.darkColor);
                    }
                    darkColor.a = premultipliedAlpha ? 1.0 : 0.0;
                }
                let slotBlendMode = slot.data.blendMode;
                if (slotBlendMode != blendMode) {
                    blendMode = slotBlendMode;
                    batcher.setBlendMode(blendMode, premultipliedAlpha);
                }
                if (clipper.isClipping()) {
                    clipper.clipTriangles(renderable.vertices, renderable.numFloats, triangles, triangles.length, uvs, finalColor, darkColor, twoColorTint);
                    let clippedVertices = new Float32Array(clipper.clippedVertices);
                    let clippedTriangles = clipper.clippedTriangles;
                    if (transformer)
                        transformer(clippedVertices, clippedVertices.length, vertexSize);
                    batcher.draw(texture, clippedVertices, clippedTriangles);
                }
                else {
                    let verts = renderable.vertices;
                    if (!twoColorTint) {
                        for (let v = 2, u = 0, n = renderable.numFloats; v < n; v += vertexSize, u += 2) {
                            verts[v] = finalColor.r;
                            verts[v + 1] = finalColor.g;
                            verts[v + 2] = finalColor.b;
                            verts[v + 3] = finalColor.a;
                            verts[v + 4] = uvs[u];
                            verts[v + 5] = uvs[u + 1];
                        }
                    }
                    else {
                        for (let v = 2, u = 0, n = renderable.numFloats; v < n; v += vertexSize, u += 2) {
                            verts[v] = finalColor.r;
                            verts[v + 1] = finalColor.g;
                            verts[v + 2] = finalColor.b;
                            verts[v + 3] = finalColor.a;
                            verts[v + 4] = uvs[u];
                            verts[v + 5] = uvs[u + 1];
                            verts[v + 6] = darkColor.r;
                            verts[v + 7] = darkColor.g;
                            verts[v + 8] = darkColor.b;
                            verts[v + 9] = darkColor.a;
                        }
                    }
                    let view = renderable.vertices.subarray(0, renderable.numFloats);
                    if (transformer)
                        transformer(renderable.vertices, renderable.numFloats, vertexSize);
                    batcher.draw(texture, view, triangles);
                }
            }
            clipper.clipEndWithSlot(slot);
        }
        clipper.clipEnd();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2tlbGV0b25SZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9Ta2VsZXRvblJlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0VBMkIrRTtBQUUvRSxPQUFPLEVBQW1CLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUF1QixnQkFBZ0IsRUFBc0IsY0FBYyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFNdk0sTUFBTSxVQUFVO0lBQ0s7SUFBa0M7SUFBNEI7SUFBbEYsWUFBb0IsUUFBeUIsRUFBUyxXQUFtQixFQUFTLFNBQWlCO1FBQS9FLGFBQVEsR0FBUixRQUFRLENBQWlCO1FBQVMsZ0JBQVcsR0FBWCxXQUFXLENBQVE7UUFBUyxjQUFTLEdBQVQsU0FBUyxDQUFRO0lBQUksQ0FBQztDQUN4RztBQUFBLENBQUM7QUFJRixNQUFNLE9BQU8sZ0JBQWdCO0lBQzVCLE1BQU0sQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRTNDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztJQUNuQixTQUFTLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUN4QixVQUFVLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUN6QixRQUFRLENBQWtCO0lBQzFCLFVBQVUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2QixZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLFVBQVUsR0FBZSxJQUFJLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xELE9BQU8sR0FBcUIsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO0lBQ25ELElBQUksR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0lB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