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
import { MeshAttachment } from "./attachments/MeshAttachment.js";
/** Stores an entry in the skin consisting of the slot index, name, and attachment **/
export class SkinEntry {
    slotIndex;
    name;
    attachment;
    constructor(slotIndex = 0, name, attachment) {
        this.slotIndex = slotIndex;
        this.name = name;
        this.attachment = attachment;
    }
}
/** Stores attachments by slot index and attachment name.
 *
 * See SkeletonData {@link SkeletonData#defaultSkin}, Skeleton {@link Skeleton#skin}, and
 * [Runtime skins](http://esotericsoftware.com/spine-runtime-skins) in the Spine Runtimes Guide. */
export class Skin {
    /** The skin's name, which is unique across all skins in the skeleton. */
    name;
    attachments = new Array();
    bones = Array();
    constraints = new Array();
    constructor(name) {
        if (!name)
            throw new Error("name cannot be null.");
        this.name = name;
    }
    /** Adds an attachment to the skin for the specified slot index and name. */
    setAttachment(slotIndex, name, attachment) {
        if (!attachment)
            throw new Error("attachment cannot be null.");
        let attachments = this.attachments;
        if (slotIndex >= attachments.length)
            attachments.length = slotIndex + 1;
        if (!attachments[slotIndex])
            attachments[slotIndex] = {};
        attachments[slotIndex][name] = attachment;
    }
    /** Adds all attachments, bones, and constraints from the specified skin to this skin. */
    addSkin(skin) {
        for (let i = 0; i < skin.bones.length; i++) {
            let bone = skin.bones[i];
            let contained = false;
            for (let ii = 0; ii < this.bones.length; ii++) {
                if (this.bones[ii] == bone) {
                    contained = true;
                    break;
                }
            }
            if (!contained)
                this.bones.push(bone);
        }
        for (let i = 0; i < skin.constraints.length; i++) {
            let constraint = skin.constraints[i];
            let contained = false;
            for (let ii = 0; ii < this.constraints.length; ii++) {
                if (this.constraints[ii] == constraint) {
                    contained = true;
                    break;
                }
            }
            if (!contained)
                this.constraints.push(constraint);
        }
        let attachments = skin.getAttachments();
        for (let i = 0; i < attachments.length; i++) {
            var attachment = attachments[i];
            this.setAttachment(attachment.slotIndex, attachment.name, attachment.attachment);
        }
    }
    /** Adds all bones and constraints and copies of all attachments from the specified skin to this skin. Mesh attachments are not
     * copied, instead a new linked mesh is created. The attachment copies can be modified without affecting the originals. */
    copySkin(skin) {
        for (let i = 0; i < skin.bones.length; i++) {
            let bone = skin.bones[i];
            let contained = false;
            for (let ii = 0; ii < this.bones.length; ii++) {
                if (this.bones[ii] == bone) {
                    contained = true;
                    break;
                }
            }
            if (!contained)
                this.bones.push(bone);
        }
        for (let i = 0; i < skin.constraints.length; i++) {
            let constraint = skin.constraints[i];
            let contained = false;
            for (let ii = 0; ii < this.constraints.length; ii++) {
                if (this.constraints[ii] == constraint) {
                    contained = true;
                    break;
                }
            }
            if (!contained)
                this.constraints.push(constraint);
        }
        let attachments = skin.getAttachments();
        for (let i = 0; i < attachments.length; i++) {
            var attachment = attachments[i];
            if (!attachment.attachment)
                continue;
            if (attachment.attachment instanceof MeshAttachment) {
                attachment.attachment = attachment.attachment.newLinkedMesh();
                this.setAttachment(attachment.slotIndex, attachment.name, attachment.attachment);
            }
            else {
                attachment.attachment = attachment.attachment.copy();
                this.setAttachment(attachment.slotIndex, attachment.name, attachment.attachment);
            }
        }
    }
    /** Returns the attachment for the specified slot index and name, or null. */
    getAttachment(slotIndex, name) {
        let dictionary = this.attachments[slotIndex];
        return dictionary ? dictionary[name] : null;
    }
    /** Removes the attachment in the skin for the specified slot index and name, if any. */
    removeAttachment(slotIndex, name) {
        let dictionary = this.attachments[slotIndex];
        if (dictionary)
            delete dictionary[name];
    }
    /** Returns all attachments in this skin. */
    getAttachments() {
        let entries = new Array();
        for (var i = 0; i < this.attachments.length; i++) {
            let slotAttachments = this.attachments[i];
            if (slotAttachments) {
                for (let name in slotAttachments) {
                    let attachment = slotAttachments[name];
                    if (attachment)
                        entries.push(new SkinEntry(i, name, attachment));
                }
            }
        }
        return entries;
    }
    /** Returns all attachments in this skin for the specified slot index. */
    getAttachmentsForSlot(slotIndex, attachments) {
        let slotAttachments = this.attachments[slotIndex];
        if (slotAttachments) {
            for (let name in slotAttachments) {
                let attachment = slotAttachments[name];
                if (attachment)
                    attachments.push(new SkinEntry(slotIndex, name, attachment));
            }
        }
    }
    /** Clears all attachments, bones, and constraints. */
    clear() {
        this.attachments.length = 0;
        this.bones.length = 0;
        this.constraints.length = 0;
    }
    /** Attach each attachment in this skin if the corresponding attachment in the old skin is currently attached. */
    attachAll(skeleton, oldSkin) {
        let slotIndex = 0;
        for (let i = 0; i < skeleton.slots.length; i++) {
            let slot = skeleton.slots[i];
            let slotAttachment = slot.getAttachment();
            if (slotAttachment && slotIndex < oldSkin.attachments.length) {
                let dictionary = oldSkin.attachments[slotIndex];
                for (let key in dictionary) {
                    let skinAttachment = dictionary[key];
                    if (slotAttachment == skinAttachment) {
                        let attachment = this.getAttachment(slotIndex, key);
                        if (attachment)
                            slot.setAttachment(attachment);
                        break;
                    }
                }
            }
            slotIndex++;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2tpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9Ta2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0VBMkIrRTtBQUcvRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFNakUsc0ZBQXNGO0FBQ3RGLE1BQU0sT0FBTyxTQUFTO0lBQ0Q7SUFBOEI7SUFBcUI7SUFBdkUsWUFBb0IsWUFBb0IsQ0FBQyxFQUFTLElBQVksRUFBUyxVQUFzQjtRQUF6RSxjQUFTLEdBQVQsU0FBUyxDQUFZO1FBQVMsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFTLGVBQVUsR0FBVixVQUFVLENBQVk7SUFBSSxDQUFDO0NBQ2xHO0FBRUQ7OzttR0FHbUc7QUFDbkcsTUFBTSxPQUFPLElBQUk7SUFDaEIseUVBQXlFO0lBQ3pFLElBQUksQ0FBUztJQUViLFdBQVcsR0FBRyxJQUFJLEtBQUssRUFBeUIsQ0FBQztJQUNqRCxLQUFLLEdBQUcsS0FBSyxFQUFZLENBQUM7SUFDMUIsV0FBVyxHQUFHLElBQUksS0FBSyxFQUFrQixDQUFDO0lBRTFDLFlBQWEsSUFBWTtRQUN4QixJQUFJLENBQUMsSUFBSTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNsQixDQUFDO0lBRUQsNEVBQTRFO0lBQzVFLGFBQWEsQ0FBRSxTQUFpQixFQUFFLElBQVksRUFBRSxVQUFzQjtRQUNyRSxJQUFJLENBQUMsVUFBVTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUMvRCxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ25DLElBQUksU0FBUyxJQUFJLFdBQVcsQ0FBQyxNQUFNO1lBQUUsV0FBVyxDQUFDLE1BQU0sR0FBRyxTQUFTLEdBQUcsQ0FBQyxDQUFD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