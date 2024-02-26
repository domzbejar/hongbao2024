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
export class ManagedWebGLRenderingContext {
    canvas;
    gl;
    restorables = new Array();
    constructor(canvasOrContext, contextConfig = { alpha: "true" }) {
        if (!((canvasOrContext instanceof WebGLRenderingContext) || (typeof WebGL2RenderingContext !== 'undefined' && canvasOrContext instanceof WebGL2RenderingContext))) {
            let canvas = canvasOrContext;
            this.gl = (canvas.getContext("webgl2", contextConfig) || canvas.getContext("webgl", contextConfig));
            this.canvas = canvas;
            canvas.addEventListener("webglcontextlost", (e) => {
                let event = e;
                if (e)
                    e.preventDefault();
            });
            canvas.addEventListener("webglcontextrestored", (e) => {
                for (let i = 0, n = this.restorables.length; i < n; i++)
                    this.restorables[i].restore();
            });
        }
        else {
            this.gl = canvasOrContext;
            this.canvas = this.gl.canvas;
        }
    }
    addRestorable(restorable) {
        this.restorables.push(restorable);
    }
    removeRestorable(restorable) {
        let index = this.restorables.indexOf(restorable);
        if (index > -1)
            this.restorables.splice(index, 1);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2ViR0wuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvV2ViR0wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBSS9FLE1BQU0sT0FBTyw0QkFBNEI7SUFDakMsTUFBTSxDQUFzQztJQUM1QyxFQUFFLENBQXdCO0lBQ3pCLFdBQVcsR0FBRyxJQUFJLEtBQUssRUFBYyxDQUFDO0lBRTlDLFlBQWEsZUFBMEQsRUFBRSxnQkFBcUIsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFO1FBQzlHLElBQUksQ0FBQyxDQUFDLENBQUMsZUFBZSxZQUFZLHFCQUFxQixDQUFDLElBQUksQ0FBQyxPQUFPLHNCQUFzQixLQUFLLFdBQVcsSUFBSSxlQUFlLFlBQVksc0JBQXNCLENBQUMsQ0FBQyxFQUFFO1lBQ2xLLElBQUksTUFBTSxHQUFzQixlQUFlLENBQUM7WUFDaEQsSUFBSSxDQUFDLEVBQUUsR0FBMEIsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQzNILElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQU0sRUFBRSxFQUFFO2dCQUN0RCxJQUFJLEtBQUssR0FBc0IsQ0FBQyxDQUFDO2dCQUNqQyxJQUFJLENBQUM7b0JBQUUsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQzNCLENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixFQUFFLENBQUMsQ0FBTSxFQUFFLEVBQUU7Z0JBQzFELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtvQkFDdEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQyxDQUFDLENBQUMsQ0FBQztTQUNIO2FBQU07WUFDTixJQUFJLENBQUMsRUFBRSxHQUFHLGVBQWUsQ0FBQztZQUMxQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDO1NBQzdCO0lBQ0YsQ0FBQztJQUVELGFBQWEsQ0FBRSxVQUFzQjtRQUNwQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsZ0JBQWdCLENBQUUsVUFBc0I7UUFDdkMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDakQsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ25ELENBQUM7Q0FDRCJ9