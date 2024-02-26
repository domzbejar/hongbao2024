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
import { TextureAtlasRegion } from "../TextureAtlas.js";
import { Color, Utils } from "../Utils.js";
import { VertexAttachment } from "./Attachment.js";
/** An attachment that displays a textured mesh. A mesh has hull vertices and internal vertices within the hull. Holes are not
 * supported. Each vertex has UVs (texture coordinates) and triangles are used to map an image on to the mesh.
 *
 * See [Mesh attachments](http://esotericsoftware.com/spine-meshes) in the Spine User Guide. */
export class MeshAttachment extends VertexAttachment {
    region = null;
    /** The name of the texture region for this attachment. */
    path;
    /** The UV pair for each vertex, normalized within the texture region. */
    regionUVs = [];
    /** The UV pair for each vertex, normalized within the entire texture.
     *
     * See {@link #updateUVs}. */
    uvs = [];
    /** Triplets of vertex indices which describe the mesh's triangulation. */
    triangles = [];
    /** The color to tint the mesh. */
    color = new Color(1, 1, 1, 1);
    /** The width of the mesh's image. Available only when nonessential data was exported. */
    width = 0;
    /** The height of the mesh's image. Available only when nonessential data was exported. */
    height = 0;
    /** The number of entries at the beginning of {@link #vertices} that make up the mesh hull. */
    hullLength = 0;
    /** Vertex index pairs describing edges for controling triangulation. Mesh triangles will never cross edges. Only available if
     * nonessential data was exported. Triangulation is not performed at runtime. */
    edges = [];
    parentMesh = null;
    sequence = null;
    tempColor = new Color(0, 0, 0, 0);
    constructor(name, path) {
        super(name);
        this.path = path;
    }
    /** Calculates {@link #uvs} using the {@link #regionUVs} and region. Must be called if the region, the region's properties, or
     * the {@link #regionUVs} are changed. */
    updateRegion() {
        if (!this.region)
            throw new Error("Region not set.");
        let regionUVs = this.regionUVs;
        if (!this.uvs || this.uvs.length != regionUVs.length)
            this.uvs = Utils.newFloatArray(regionUVs.length);
        let uvs = this.uvs;
        let n = this.uvs.length;
        let u = this.region.u, v = this.region.v, width = 0, height = 0;
        if (this.region instanceof TextureAtlasRegion) {
            let region = this.region, image = region.page.texture.getImage();
            let textureWidth = image.width, textureHeight = image.height;
            switch (region.degrees) {
                case 90:
                    u -= (region.originalHeight - region.offsetY - region.height) / textureWidth;
                    v -= (region.originalWidth - region.offsetX - region.width) / textureHeight;
                    width = region.originalHeight / textureWidth;
                    height = region.originalWidth / textureHeight;
                    for (let i = 0; i < n; i += 2) {
                        uvs[i] = u + regionUVs[i + 1] * width;
                        uvs[i + 1] = v + (1 - regionUVs[i]) * height;
                    }
                    return;
                case 180:
                    u -= (region.originalWidth - region.offsetX - region.width) / textureWidth;
                    v -= region.offsetY / textureHeight;
                    width = region.originalWidth / textureWidth;
                    height = region.originalHeight / textureHeight;
                    for (let i = 0; i < n; i += 2) {
                        uvs[i] = u + (1 - regionUVs[i]) * width;
                        uvs[i + 1] = v + (1 - regionUVs[i + 1]) * height;
                    }
                    return;
                case 270:
                    u -= region.offsetY / textureWidth;
                    v -= region.offsetX / textureHeight;
                    width = region.originalHeight / textureWidth;
                    height = region.originalWidth / textureHeight;
                    for (let i = 0; i < n; i += 2) {
                        uvs[i] = u + (1 - regionUVs[i + 1]) * width;
                        uvs[i + 1] = v + regionUVs[i] * height;
                    }
                    return;
            }
            u -= region.offsetX / textureWidth;
            v -= (region.originalHeight - region.offsetY - region.height) / textureHeight;
            width = region.originalWidth / textureWidth;
            height = region.originalHeight / textureHeight;
        }
        else if (!this.region) {
            u = v = 0;
            width = height = 1;
        }
        else {
            width = this.region.u2 - u;
            height = this.region.v2 - v;
        }
        for (let i = 0; i < n; i += 2) {
            uvs[i] = u + regionUVs[i] * width;
            uvs[i + 1] = v + regionUVs[i + 1] * height;
        }
    }
    /** The parent mesh if this is a linked mesh, else null. A linked mesh shares the {@link #bones}, {@link #vertices},
     * {@link #regionUVs}, {@link #triangles}, {@link #hullLength}, {@link #edges}, {@link #width}, and {@link #height} with the
     * parent mesh, but may have a different {@link #name} or {@link #path} (and therefore a different texture). */
    getParentMesh() {
        return this.parentMesh;
    }
    /** @param parentMesh May be null. */
    setParentMesh(parentMesh) {
        this.parentMesh = parentMesh;
        if (parentMesh) {
            this.bones = parentMesh.bones;
            this.vertices = parentMesh.vertices;
            this.worldVerticesLength = parentMesh.worldVerticesLength;
            this.regionUVs = parentMesh.regionUVs;
            this.triangles = parentMesh.triangles;
            this.hullLength = parentMesh.hullLength;
            this.worldVerticesLength = parentMesh.worldVerticesLength;
        }
    }
    copy() {
        if (this.parentMesh)
            return this.newLinkedMesh();
        let copy = new MeshAttachment(this.name, this.path);
        copy.region = this.region;
        copy.color.setFromColor(this.color);
        this.copyTo(copy);
        copy.regionUVs = new Array(this.regionUVs.length);
        Utils.arrayCopy(this.regionUVs, 0, copy.regionUVs, 0, this.regionUVs.length);
        copy.uvs = new Array(this.uvs.length);
        Utils.arrayCopy(this.uvs, 0, copy.uvs, 0, this.uvs.length);
        copy.triangles = new Array(this.triangles.length);
        Utils.arrayCopy(this.triangles, 0, copy.triangles, 0, this.triangles.length);
        copy.hullLength = this.hullLength;
        copy.sequence = this.sequence != null ? this.sequence.copy() : null;
        // Nonessential.
        if (this.edges) {
            copy.edges = new Array(this.edges.length);
            Utils.arrayCopy(this.edges, 0, copy.edges, 0, this.edges.length);
        }
        copy.width = this.width;
        copy.height = this.height;
        return copy;
    }
    computeWorldVertices(slot, start, count, worldVertices, offset, stride) {
        if (this.sequence != null)
            this.sequence.apply(slot, this);
        super.computeWorldVertices(slot, start, count, worldVertices, offset, stride);
    }
    /** Returns a new mesh with the {@link #parentMesh} set to this mesh's parent mesh, if any, else to this mesh. **/
    newLinkedMesh() {
        let copy = new MeshAttachment(this.name, this.path);
        copy.region = this.region;
        copy.color.setFromColor(this.color);
        copy.timelineAttachment = this.timelineAttachment;
        copy.setParentMesh(this.parentMesh ? this.parentMesh : this);
        if (copy.region != null)
            copy.updateRegion();
        return copy;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVzaEF0dGFjaG1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYXR0YWNobWVudHMvTWVzaEF0dGFjaG1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRy9FLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3hELE9BQU8sRUFBRSxLQUFLLEVBQW1CLEtBQUssRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUM1RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQWMsTUFBTSxpQkFBaUIsQ0FBQztBQUsvRDs7OytGQUcrRjtBQUMvRixNQUFNLE9BQU8sY0FBZSxTQUFRLGdCQUFnQjtJQUNuRCxNQUFNLEdBQXlCLElBQUksQ0FBQztJQUVwQywwREFBMEQ7SUFDMUQsSUFBSSxDQUFTO0lBRWIseUVBQXlFO0lBQ3pFLFNBQVMsR0FBb0IsRUFBRSxDQUFDO0lBRWhDOztpQ0FFNkI7SUFDN0IsR0FBRyxHQUFvQixFQUFFLENBQUM7SUFFMUIsMEVBQTBFO0lBQzFFLFNBQVMsR0FBa0IsRUFBRSxDQUFDO0lBRTlCLGtDQUFrQztJQUNsQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFOUIseUZBQXlGO0lBQ3pGLEtBQUssR0FBVyxDQUFDLENBQUM7SUFFbEIsMEZBQTBGO0lBQzFGLE1BQU0sR0FBVyxDQUFDLENBQUM7SUFFbkIsOEZBQThGO0lBQzlGLFVBQVUsR0FBVyxDQUFDLENBQUM7SUFFdkI7b0ZBQ2dGO0lBQ2hGLEtBQUssR0FBa0IsRUFBRSxDQUFDO0lBRWxCLFVBQVUsR0FBMEIsSUFBSSxDQUFDO0lBRWpELFFBQVEsR0FBb0IsSUFBSSxDQUFDO0lBRWpDLFNBQVMsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxD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