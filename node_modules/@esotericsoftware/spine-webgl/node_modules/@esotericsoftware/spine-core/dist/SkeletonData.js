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
/** Stores the setup pose and all of the stateless data for a skeleton.
 *
 * See [Data objects](http://esotericsoftware.com/spine-runtime-architecture#Data-objects) in the Spine Runtimes
 * Guide. */
export class SkeletonData {
    /** The skeleton's name, which by default is the name of the skeleton data file, if possible. May be null. */
    name = null;
    /** The skeleton's bones, sorted parent first. The root bone is always the first bone. */
    bones = new Array(); // Ordered parents first.
    /** The skeleton's slots. */
    slots = new Array(); // Setup pose draw order.
    skins = new Array();
    /** The skeleton's default skin. By default this skin contains all attachments that were not in a skin in Spine.
     *
     * See {@link Skeleton#getAttachmentByName()}.
     * May be null. */
    defaultSkin = null;
    /** The skeleton's events. */
    events = new Array();
    /** The skeleton's animations. */
    animations = new Array();
    /** The skeleton's IK constraints. */
    ikConstraints = new Array();
    /** The skeleton's transform constraints. */
    transformConstraints = new Array();
    /** The skeleton's path constraints. */
    pathConstraints = new Array();
    /** The X coordinate of the skeleton's axis aligned bounding box in the setup pose. */
    x = 0;
    /** The Y coordinate of the skeleton's axis aligned bounding box in the setup pose. */
    y = 0;
    /** The width of the skeleton's axis aligned bounding box in the setup pose. */
    width = 0;
    /** The height of the skeleton's axis aligned bounding box in the setup pose. */
    height = 0;
    /** The Spine version used to export the skeleton data, or null. */
    version = null;
    /** The skeleton data hash. This value will change if any of the skeleton data has changed. May be null. */
    hash = null;
    // Nonessential
    /** The dopesheet FPS in Spine. Available only when nonessential data was exported. */
    fps = 0;
    /** The path to the images directory as defined in Spine. Available only when nonessential data was exported. May be null. */
    imagesPath = null;
    /** The path to the audio directory as defined in Spine. Available only when nonessential data was exported. May be null. */
    audioPath = null;
    /** Finds a bone by comparing each bone's name. It is more efficient to cache the results of this method than to call it
     * multiple times.
     * @returns May be null. */
    findBone(boneName) {
        if (!boneName)
            throw new Error("boneName cannot be null.");
        let bones = this.bones;
        for (let i = 0, n = bones.length; i < n; i++) {
            let bone = bones[i];
            if (bone.name == boneName)
                return bone;
        }
        return null;
    }
    /** Finds a slot by comparing each slot's name. It is more efficient to cache the results of this method than to call it
     * multiple times.
     * @returns May be null. */
    findSlot(slotName) {
        if (!slotName)
            throw new Error("slotName cannot be null.");
        let slots = this.slots;
        for (let i = 0, n = slots.length; i < n; i++) {
            let slot = slots[i];
            if (slot.name == slotName)
                return slot;
        }
        return null;
    }
    /** Finds a skin by comparing each skin's name. It is more efficient to cache the results of this method than to call it
     * multiple times.
     * @returns May be null. */
    findSkin(skinName) {
        if (!skinName)
            throw new Error("skinName cannot be null.");
        let skins = this.skins;
        for (let i = 0, n = skins.length; i < n; i++) {
            let skin = skins[i];
            if (skin.name == skinName)
                return skin;
        }
        return null;
    }
    /** Finds an event by comparing each events's name. It is more efficient to cache the results of this method than to call it
     * multiple times.
     * @returns May be null. */
    findEvent(eventDataName) {
        if (!eventDataName)
            throw new Error("eventDataName cannot be null.");
        let events = this.events;
        for (let i = 0, n = events.length; i < n; i++) {
            let event = events[i];
            if (event.name == eventDataName)
                return event;
        }
        return null;
    }
    /** Finds an animation by comparing each animation's name. It is more efficient to cache the results of this method than to
     * call it multiple times.
     * @returns May be null. */
    findAnimation(animationName) {
        if (!animationName)
            throw new Error("animationName cannot be null.");
        let animations = this.animations;
        for (let i = 0, n = animations.length; i < n; i++) {
            let animation = animations[i];
            if (animation.name == animationName)
                return animation;
        }
        return null;
    }
    /** Finds an IK constraint by comparing each IK constraint's name. It is more efficient to cache the results of this method
     * than to call it multiple times.
     * @return May be null. */
    findIkConstraint(constraintName) {
        if (!constraintName)
            throw new Error("constraintName cannot be null.");
        let ikConstraints = this.ikConstraints;
        for (let i = 0, n = ikConstraints.length; i < n; i++) {
            let constraint = ikConstraints[i];
            if (constraint.name == constraintName)
                return constraint;
        }
        return null;
    }
    /** Finds a transform constraint by comparing each transform constraint's name. It is more efficient to cache the results of
     * this method than to call it multiple times.
     * @return May be null. */
    findTransformConstraint(constraintName) {
        if (!constraintName)
            throw new Error("constraintName cannot be null.");
        let transformConstraints = this.transformConstraints;
        for (let i = 0, n = transformConstraints.length; i < n; i++) {
            let constraint = transformConstraints[i];
            if (constraint.name == constraintName)
                return constraint;
        }
        return null;
    }
    /** Finds a path constraint by comparing each path constraint's name. It is more efficient to cache the results of this method
     * than to call it multiple times.
     * @return May be null. */
    findPathConstraint(constraintName) {
        if (!constraintName)
            throw new Error("constraintName cannot be null.");
        let pathConstraints = this.pathConstraints;
        for (let i = 0, n = pathConstraints.length; i < n; i++) {
            let constraint = pathConstraints[i];
            if (constraint.name == constraintName)
                return constraint;
        }
        return null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2tlbGV0b25EYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1NrZWxldG9uRGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytFQTJCK0U7QUFXL0U7OztZQUdZO0FBQ1osTUFBTSxPQUFPLFlBQVk7SUFFeEIsNkdBQTZHO0lBQzdHLElBQUksR0FBa0IsSUFBSSxDQUFDO0lBRTNCLHlGQUF5RjtJQUN6RixLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQVksQ0FBQyxDQUFDLHlCQUF5QjtJQUV4RCw0QkFBNEI7SUFDNUIsS0FBSyxHQUFHLElBQUksS0FBSyxFQUFZLENBQUMsQ0FBQyx5QkFBeUI7SUFDeEQsS0FBSyxHQUFHLElBQUksS0FBSyxFQUFRLENBQUM7SUFFMUI7OztzQkFHa0I7SUFDbEIsV0FBVyxHQUFnQixJQUFJLENBQUM7SUFFaEMsNkJBQTZCO0lBQzdCLE1BQU0sR0FBRyxJQUFJLEtBQUssRUFBYSxDQUFDO0lBRWhDLGlDQUFpQztJQUNqQyxVQUFVLEdBQUcsSUFBSSxLQUFLLEVBQWEsQ0FBQztJQUVwQyxxQ0FBcUM7SUFDckMsYUFBYSxHQUFHLElBQUksS0FBSyxFQUFvQixDQUFDO0lBRTlDLDRDQUE0QztJQUM1QyxvQkFBb0IsR0FBRyxJQUFJLEtBQUssRUFBMkIsQ0FBQztJQUU1RCx1Q0FBdUM7SUFDdkMsZUFBZSxHQUFHLElBQUksS0FBSyxFQUFzQixDQUFDO0lBRWxELHNGQUFzRjtJQUN0RixDQUFDLEdBQVcsQ0FBQyxDQUFDO0lBRWQsc0ZBQXNGO0lBQ3RGLENBQUMsR0FBVyxDQUFDLENBQUM7SUFFZCwrRUFBK0U7SUFDL0UsS0FBSyxHQUFXLENBQUMsQ0FBQztJQUVsQixnRkFBZ0Y7SUFDaEYsTUFBTSxHQUFXLENBQUMsQ0FBQztJQUVuQixtRUFBbUU7SUFDbkUsT0FBTyxHQUFrQixJQUFJLENBQUM7SUFFOUIsMkdBQTJHO0lBQzNHLElBQUksR0FBa0Is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