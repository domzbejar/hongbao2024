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
import { Color } from "./Utils.js";
/** Stores the setup pose for a {@link Bone}. */
export class BoneData {
    /** The index of the bone in {@link Skeleton#getBones()}. */
    index = 0;
    /** The name of the bone, which is unique across all bones in the skeleton. */
    name;
    /** @returns May be null. */
    parent = null;
    /** The bone's length. */
    length = 0;
    /** The local x translation. */
    x = 0;
    /** The local y translation. */
    y = 0;
    /** The local rotation. */
    rotation = 0;
    /** The local scaleX. */
    scaleX = 1;
    /** The local scaleY. */
    scaleY = 1;
    /** The local shearX. */
    shearX = 0;
    /** The local shearX. */
    shearY = 0;
    /** The transform mode for how parent world transforms affect this bone. */
    transformMode = TransformMode.Normal;
    /** When true, {@link Skeleton#updateWorldTransform()} only updates this bone if the {@link Skeleton#skin} contains this
      * bone.
      * @see Skin#bones */
    skinRequired = false;
    /** The color of the bone as it was in Spine. Available only when nonessential data was exported. Bones are not usually
     * rendered at runtime. */
    color = new Color();
    constructor(index, name, parent) {
        if (index < 0)
            throw new Error("index must be >= 0.");
        if (!name)
            throw new Error("name cannot be null.");
        this.index = index;
        this.name = name;
        this.parent = parent;
    }
}
/** Determines how a bone inherits world transforms from parent bones. */
export var TransformMode;
(function (TransformMode) {
    TransformMode[TransformMode["Normal"] = 0] = "Normal";
    TransformMode[TransformMode["OnlyTranslation"] = 1] = "OnlyTranslation";
    TransformMode[TransformMode["NoRotationOrReflection"] = 2] = "NoRotationOrReflection";
    TransformMode[TransformMode["NoScale"] = 3] = "NoScale";
    TransformMode[TransformMode["NoScaleOrReflection"] = 4] = "NoScaleOrReflection";
})(TransformMode || (TransformMode = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm9uZURhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvQm9uZURhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRS9FLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFbkMsZ0RBQWdEO0FBQ2hELE1BQU0sT0FBTyxRQUFRO0lBQ3BCLDREQUE0RDtJQUM1RCxLQUFLLEdBQVcsQ0FBQyxDQUFDO0lBRWxCLDhFQUE4RTtJQUM5RSxJQUFJLENBQVM7SUFFYiw0QkFBNEI7SUFDNUIsTUFBTSxHQUFvQixJQUFJLENBQUM7SUFFL0IseUJBQXlCO0lBQ3pCLE1BQU0sR0FBVyxDQUFDLENBQUM7SUFFbkIsK0JBQStCO0lBQy9CLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFTiwrQkFBK0I7SUFDL0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVOLDBCQUEwQjtJQUMxQixRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBRWIsd0JBQXdCO0lBQ3hCLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFFWCx3QkFBd0I7SUFDeEIsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUVYLHdCQUF3QjtJQUN4QixNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBRVgsd0JBQXdCO0lBQ3hCLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFFWCwyRUFBMkU7SUFDM0UsYUFBYSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUM7SUFFckM7OzBCQUVzQjtJQUN0QixZQUFZLEdBQUcsS0FBSyxDQUFDO0lBRXJCOzhCQUMwQjtJQUMxQixLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUVwQixZQUFhLEtBQWEsRUFBRSxJQUFZLEVBQUUsTUFBdUI7UUFDaEUsSUFBSSxLQUFLLEdBQUcsQ0FBQztZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsSUFBSTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN0QixDQUFDO0NBQ0Q7QUFFRCx5RUFBeUU7QUFDekUsTUFBTSxDQUFOLElBQVksYUFBK0Y7QUFBM0csV0FBWSxhQUFhO0lBQUcscURBQU0sQ0FBQTtJQUFFLHVFQUFlLENBQUE7SUFBRSxxRkFBc0IsQ0FBQTtJQUFFLHVEQUFPLENBQUE7SUFBRSwrRUFBbUIsQ0FBQTtBQUFDLENBQUMsRUFBL0YsYUFBYSxLQUFiLGFBQWEsUUFBa0YifQ==