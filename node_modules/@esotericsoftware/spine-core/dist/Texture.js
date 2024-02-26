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
export class Texture {
    _image;
    constructor(image) {
        this._image = image;
    }
    getImage() {
        return this._image;
    }
}
export var TextureFilter;
(function (TextureFilter) {
    TextureFilter[TextureFilter["Nearest"] = 9728] = "Nearest";
    TextureFilter[TextureFilter["Linear"] = 9729] = "Linear";
    TextureFilter[TextureFilter["MipMap"] = 9987] = "MipMap";
    TextureFilter[TextureFilter["MipMapNearestNearest"] = 9984] = "MipMapNearestNearest";
    TextureFilter[TextureFilter["MipMapLinearNearest"] = 9985] = "MipMapLinearNearest";
    TextureFilter[TextureFilter["MipMapNearestLinear"] = 9986] = "MipMapNearestLinear";
    TextureFilter[TextureFilter["MipMapLinearLinear"] = 9987] = "MipMapLinearLinear"; // WebGLRenderingContext.LINEAR_MIPMAP_LINEAR
})(TextureFilter || (TextureFilter = {}));
export var TextureWrap;
(function (TextureWrap) {
    TextureWrap[TextureWrap["MirroredRepeat"] = 33648] = "MirroredRepeat";
    TextureWrap[TextureWrap["ClampToEdge"] = 33071] = "ClampToEdge";
    TextureWrap[TextureWrap["Repeat"] = 10497] = "Repeat"; // WebGLRenderingContext.REPEAT
})(TextureWrap || (TextureWrap = {}));
export class TextureRegion {
    texture;
    u = 0;
    v = 0;
    u2 = 0;
    v2 = 0;
    width = 0;
    height = 0;
    degrees = 0;
    offsetX = 0;
    offsetY = 0;
    originalWidth = 0;
    originalHeight = 0;
}
export class FakeTexture extends Texture {
    setFilters(minFilter, magFilter) { }
    setWraps(uWrap, vWrap) { }
    dispose() { }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGV4dHVyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9UZXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0VBMkIrRTtBQUUvRSxNQUFNLE9BQWdCLE9BQU87SUFDbEIsTUFBTSxDQUFpQztJQUVqRCxZQUFhLEtBQXFDO1FBQ2pELElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxRQUFRO1FBQ1AsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3BCLENBQUM7Q0FLRDtBQUVELE1BQU0sQ0FBTixJQUFZLGFBUVg7QUFSRCxXQUFZLGFBQWE7SUFDeEIsMERBQWMsQ0FBQTtJQUNkLHdEQUFhLENBQUE7SUFDYix3REFBYSxDQUFBO0lBQ2Isb0ZBQTJCLENBQUE7SUFDM0Isa0ZBQTBCLENBQUE7SUFDMUIsa0ZBQTBCLENBQUE7SUFDMUIsZ0ZBQXlCLENBQUEsQ0FBQyw2Q0FBNkM7QUFDeEUsQ0FBQyxFQVJXLGFBQWEsS0FBYixhQUFhLFFBUXhCO0FBRUQsTUFBTSxDQUFOLElBQVksV0FJWDtBQUpELFdBQVksV0FBVztJQUN0QixxRUFBc0IsQ0FBQTtJQUN0QiwrREFBbUIsQ0FBQTtJQUNuQixxREFBYyxDQUFBLENBQUMsK0JBQStCO0FBQy9DLENBQUMsRUFKVyxXQUFXLEtBQVgsV0FBVyxRQUl0QjtBQUVELE1BQU0sT0FBTyxhQUFhO0lBQ3pCLE9BQU8sQ0FBTTtJQUNiLENBQUMsR0FBRyxDQUFDLENBQUM7SUFBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDZixLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUN0QixPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBQ1osT0FBTyxHQUFHLENBQUMsQ0FBQztJQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7SUFDekIsYUFBYSxHQUFHLENBQUMsQ0FBQztJQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7Q0FDdEM7QUFFRCxNQUFNLE9BQU8sV0FBWSxTQUFRLE9BQU87SUFDdkMsVUFBVSxDQUFFLFNBQXdCLEVBQUUsU0FBd0IsSUFBSSxDQUFDO0lBQ25FLFFBQVEsQ0FBRSxLQUFrQixFQUFFLEtBQWtCLElBQUksQ0FBQztJQUNyRCxPQUFPLEtBQU0sQ0FBQztDQUNkIn0=