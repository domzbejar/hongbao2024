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
import { Animation, AttachmentTimeline, RGBATimeline, RGBTimeline, RGBA2Timeline, RGB2Timeline, AlphaTimeline, RotateTimeline, TranslateTimeline, TranslateXTimeline, TranslateYTimeline, ScaleTimeline, ScaleXTimeline, ScaleYTimeline, ShearTimeline, ShearXTimeline, ShearYTimeline, IkConstraintTimeline, TransformConstraintTimeline, PathConstraintPositionTimeline, PathConstraintSpacingTimeline, PathConstraintMixTimeline, DeformTimeline, DrawOrderTimeline, EventTimeline, SequenceTimeline } from "./Animation.js";
import { Sequence, SequenceModeValues } from "./attachments/Sequence.js";
import { BoneData } from "./BoneData.js";
import { Event } from "./Event.js";
import { EventData } from "./EventData.js";
import { IkConstraintData } from "./IkConstraintData.js";
import { PathConstraintData, PositionMode, SpacingMode } from "./PathConstraintData.js";
import { SkeletonData } from "./SkeletonData.js";
import { Skin } from "./Skin.js";
import { SlotData } from "./SlotData.js";
import { TransformConstraintData } from "./TransformConstraintData.js";
import { Color, Utils } from "./Utils.js";
/** Loads skeleton data in the Spine binary format.
 *
 * See [Spine binary format](http://esotericsoftware.com/spine-binary-format) and
 * [JSON and binary data](http://esotericsoftware.com/spine-loading-skeleton-data#JSON-and-binary-data) in the Spine
 * Runtimes Guide. */
export class SkeletonBinary {
    /** Scales bone positions, image sizes, and translations as they are loaded. This allows different size images to be used at
     * runtime than were used in Spine.
     *
     * See [Scaling](http://esotericsoftware.com/spine-loading-skeleton-data#Scaling) in the Spine Runtimes Guide. */
    scale = 1;
    attachmentLoader;
    linkedMeshes = new Array();
    constructor(attachmentLoader) {
        this.attachmentLoader = attachmentLoader;
    }
    readSkeletonData(binary) {
        let scale = this.scale;
        let skeletonData = new SkeletonData();
        skeletonData.name = ""; // BOZO
        let input = new BinaryInput(binary);
        let lowHash = input.readInt32();
        let highHash = input.readInt32();
        skeletonData.hash = highHash == 0 && lowHash == 0 ? null : highHash.toString(16) + lowHash.toString(16);
        skeletonData.version = input.readString();
        skeletonData.x = input.readFloat();
        skeletonData.y = input.readFloat();
        skeletonData.width = input.readFloat();
        skeletonData.height = input.readFloat();
        let nonessential = input.readBoolean();
        if (nonessential) {
            skeletonData.fps = input.readFloat();
            skeletonData.imagesPath = input.readString();
            skeletonData.audioPath = input.readString();
        }
        let n = 0;
        // Strings.
        n = input.readInt(true);
        for (let i = 0; i < n; i++) {
            let str = input.readString();
            if (!str)
                throw new Error("String in string table must not be null.");
            input.strings.push(str);
        }
        // Bones.
        n = input.readInt(true);
        for (let i = 0; i < n; i++) {
            let name = input.readString();
            if (!name)
                throw new Error("Bone name must not be null.");
            let parent = i == 0 ? null : skeletonData.bones[input.readInt(true)];
            let data = new BoneData(i, name, parent);
            data.rotation = input.readFloat();
            data.x = input.readFloat() * scale;
            data.y = input.readFloat() * scale;
            data.scaleX = input.readFloat();
            data.scaleY = input.readFloat();
            data.shearX = input.readFloat();
            data.shearY = input.readFloat();
            data.length = input.readFloat() * scale;
            data.transformMode = input.readInt(true);
            data.skinRequired = input.readBoolean();
            if (nonessential)
                Color.rgba8888ToColor(data.color, input.readInt32());
            skeletonData.bones.push(data);
        }
        // Slots.
        n = input.readInt(true);
        for (let i = 0; i < n; i++) {
            let slotName = input.readString();
            if (!slotName)
                throw new Error("Slot name must not be null.");
            let boneData = skeletonData.bones[input.readInt(true)];
            let data = new SlotData(i, slotName, boneData);
            Color.rgba8888ToColor(data.color, input.readInt32());
            let darkColor = input.readInt32();
            if (darkColor != -1)
                Color.rgb888ToColor(data.darkColor = new Color(), darkColor);
            data.attachmentName = input.readStringRef();
            data.blendMode = input.readInt(true);
            skeletonData.slots.push(data);
        }
        // IK constraints.
        n = input.readInt(true);
        for (let i = 0, nn; i < n; i++) {
            let name = input.readString();
            if (!name)
                throw new Error("IK constraint data name must not be null.");
            let data = new IkConstraintData(name);
            data.order = input.readInt(true);
            data.skinRequired = input.readBoolean();
            nn = input.readInt(true);
            for (let ii = 0; ii < nn; ii++)
                data.bones.push(skeletonData.bones[input.readInt(true)]);
            data.target = skeletonData.bones[input.readInt(true)];
            data.mix = input.readFloat();
            data.softness = input.readFloat() * scale;
            data.bendDirection = input.readByte();
            data.compress = input.readBoolean();
            data.stretch = input.readBoolean();
            data.uniform = input.readBoolean();
            skeletonData.ikConstraints.push(data);
        }
        // Transform constraints.
        n = input.readInt(true);
        for (let i = 0, nn; i < n; i++) {
            let name = input.readString();
            if (!name)
                throw new Error("Transform constraint data name must not be null.");
            let data = new TransformConstraintData(name);
            data.order = input.readInt(true);
            data.skinRequired = input.readBoolean();
            nn = input.readInt(true);
            for (let ii = 0; ii < nn; ii++)
                data.bones.push(skeletonData.bones[input.readInt(true)]);
            data.target = skeletonData.bones[input.readInt(true)];
            data.local = input.readBoolean();
            data.relative = input.readBoolean();
            data.offsetRotation = input.readFloat();
            data.offsetX = input.readFloat() * scale;
            data.offsetY = input.readFloat() * scale;
            data.offsetScaleX = input.readFloat();
            data.offsetScaleY = input.readFloat();
            data.offsetShearY = input.readFloat();
            data.mixRotate = input.readFloat();
            data.mixX = input.readFloat();
            data.mixY = input.readFloat();
            data.mixScaleX = input.readFloat();
            data.mixScaleY = input.readFloat();
            data.mixShearY = input.readFloat();
            skeletonData.transformConstraints.push(data);
        }
        // Path constraints.
        n = input.readInt(true);
        for (let i = 0, nn; i < n; i++) {
            let name = input.readString();
            if (!name)
                throw new Error("Path constraint data name must not be null.");
            let data = new PathConstraintData(name);
            data.order = input.readInt(true);
            data.skinRequired = input.readBoolean();
            nn = input.readInt(true);
            for (let ii = 0; ii < nn; ii++)
                data.bones.push(skeletonData.bones[input.readInt(true)]);
            data.target = skeletonData.slots[input.readInt(true)];
            data.positionMode = input.readInt(true);
            data.spacingMode = input.readInt(true);
            data.rotateMode = input.readInt(true);
            data.offsetRotation = input.readFloat();
            data.position = input.readFloat();
            if (data.positionMode == PositionMode.Fixed)
                data.position *= scale;
            data.spacing = input.readFloat();
            if (data.spacingMode == SpacingMode.Length || data.spacingMode == SpacingMode.Fixed)
                data.spacing *= scale;
            data.mixRotate = input.readFloat();
            data.mixX = input.readFloat();
            data.mixY = input.readFloat();
            skeletonData.pathConstraints.push(data);
        }
        // Default skin.
        let defaultSkin = this.readSkin(input, skeletonData, true, nonessential);
        if (defaultSkin) {
            skeletonData.defaultSkin = defaultSkin;
            skeletonData.skins.push(defaultSkin);
        }
        // Skins.
        {
            let i = skeletonData.skins.length;
            Utils.setArraySize(skeletonData.skins, n = i + input.readInt(true));
            for (; i < n; i++) {
                let skin = this.readSkin(input, skeletonData, false, nonessential);
                if (!skin)
                    throw new Error("readSkin() should not have returned null.");
                skeletonData.skins[i] = skin;
            }
        }
        // Linked meshes.
        n = this.linkedMeshes.length;
        for (let i = 0; i < n; i++) {
            let linkedMesh = this.linkedMeshes[i];
            let skin = !linkedMesh.skin ? skeletonData.defaultSkin : skeletonData.findSkin(linkedMesh.skin);
            if (!skin)
                throw new Error("Not skin found for linked mesh.");
            if (!linkedMesh.parent)
                throw new Error("Linked mesh parent must not be null");
            let parent = skin.getAttachment(linkedMesh.slotIndex, linkedMesh.parent);
            if (!parent)
                throw new Error(`Parent mesh not found: ${linkedMesh.parent}`);
            linkedMesh.mesh.timelineAttachment = linkedMesh.inheritTimeline ? parent : linkedMesh.mesh;
            linkedMesh.mesh.setParentMesh(parent);
            if (linkedMesh.mesh.region != null)
                linkedMesh.mesh.updateRegion();
        }
        this.linkedMeshes.length = 0;
        // Events.
        n = input.readInt(true);
        for (let i = 0; i < n; i++) {
            let eventName = input.readStringRef();
            if (!eventName)
                throw new Error;
            let data = new EventData(eventName);
            data.intValue = input.readInt(false);
            data.floatValue = input.readFloat();
            data.stringValue = input.readString();
            data.audioPath = input.readString();
            if (data.audioPath) {
                data.volume = input.readFloat();
                data.balance = input.readFloat();
            }
            skeletonData.events.push(data);
        }
        // Animations.
        n = input.readInt(true);
        for (let i = 0; i < n; i++) {
            let animationName = input.readString();
            if (!animationName)
                throw new Error("Animatio name must not be null.");
            skeletonData.animations.push(this.readAnimation(input, animationName, skeletonData));
        }
        return skeletonData;
    }
    readSkin(input, skeletonData, defaultSkin, nonessential) {
        let skin = null;
        let slotCount = 0;
        if (defaultSkin) {
            slotCount = input.readInt(true);
            if (slotCount == 0)
                return null;
            skin = new Skin("default");
        }
        else {
            let skinName = input.readStringRef();
            if (!skinName)
                throw new Error("Skin name must not be null.");
            skin = new Skin(skinName);
            skin.bones.length = input.readInt(true);
            for (let i = 0, n = skin.bones.length; i < n; i++)
                skin.bones[i] = skeletonData.bones[input.readInt(true)];
            for (let i = 0, n = input.readInt(true); i < n; i++)
                skin.constraints.push(skeletonData.ikConstraints[input.readInt(true)]);
            for (let i = 0, n = input.readInt(true); i < n; i++)
                skin.constraints.push(skeletonData.transformConstraints[input.readInt(true)]);
            for (let i = 0, n = input.readInt(true); i < n; i++)
                skin.constraints.push(skeletonData.pathConstraints[input.readInt(true)]);
            slotCount = input.readInt(true);
        }
        for (let i = 0; i < slotCount; i++) {
            let slotIndex = input.readInt(true);
            for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
                let name = input.readStringRef();
                if (!name)
                    throw new Error("Attachment name must not be null");
                let attachment = this.readAttachment(input, skeletonData, skin, slotIndex, name, nonessential);
                if (attachment)
                    skin.setAttachment(slotIndex, name, attachment);
            }
        }
        return skin;
    }
    readAttachment(input, skeletonData, skin, slotIndex, attachmentName, nonessential) {
        let scale = this.scale;
        let name = input.readStringRef();
        if (!name)
            name = attachmentName;
        switch (input.readByte()) {
            case AttachmentType.Region: {
                let path = input.readStringRef();
                let rotation = input.readFloat();
                let x = input.readFloat();
                let y = input.readFloat();
                let scaleX = input.readFloat();
                let scaleY = input.readFloat();
                let width = input.readFloat();
                let height = input.readFloat();
                let color = input.readInt32();
                let sequence = this.readSequence(input);
                if (!path)
                    path = name;
                let region = this.attachmentLoader.newRegionAttachment(skin, name, path, sequence);
                if (!region)
                    return null;
                region.path = path;
                region.x = x * scale;
                region.y = y * scale;
                region.scaleX = scaleX;
                region.scaleY = scaleY;
                region.rotation = rotation;
                region.width = width * scale;
                region.height = height * scale;
                Color.rgba8888ToColor(region.color, color);
                region.sequence = sequence;
                if (sequence == null)
                    region.updateRegion();
                return region;
            }
            case AttachmentType.BoundingBox: {
                let vertexCount = input.readInt(true);
                let vertices = this.readVertices(input, vertexCount);
                let color = nonessential ? input.readInt32() : 0;
                let box = this.attachmentLoader.newBoundingBoxAttachment(skin, name);
                if (!box)
                    return null;
                box.worldVerticesLength = vertexCount << 1;
                box.vertices = vertices.vertices;
                box.bones = vertices.bones;
                if (nonessential)
                    Color.rgba8888ToColor(box.color, color);
                return box;
            }
            case AttachmentType.Mesh: {
                let path = input.readStringRef();
                let color = input.readInt32();
                let vertexCount = input.readInt(true);
                let uvs = this.readFloatArray(input, vertexCount << 1, 1);
                let triangles = this.readShortArray(input);
                let vertices = this.readVertices(input, vertexCount);
                let hullLength = input.readInt(true);
                let sequence = this.readSequence(input);
                let edges = [];
                let width = 0, height = 0;
                if (nonessential) {
                    edges = this.readShortArray(input);
                    width = input.readFloat();
                    height = input.readFloat();
                }
                if (!path)
                    path = name;
                let mesh = this.attachmentLoader.newMeshAttachment(skin, name, path, sequence);
                if (!mesh)
                    return null;
                mesh.path = path;
                Color.rgba8888ToColor(mesh.color, color);
                mesh.bones = vertices.bones;
                mesh.vertices = vertices.vertices;
                mesh.worldVerticesLength = vertexCount << 1;
                mesh.triangles = triangles;
                mesh.regionUVs = uvs;
                if (sequence == null)
                    mesh.updateRegion();
                mesh.hullLength = hullLength << 1;
                mesh.sequence = sequence;
                if (nonessential) {
                    mesh.edges = edges;
                    mesh.width = width * scale;
                    mesh.height = height * scale;
                }
                return mesh;
            }
            case AttachmentType.LinkedMesh: {
                let path = input.readStringRef();
                let color = input.readInt32();
                let skinName = input.readStringRef();
                let parent = input.readStringRef();
                let inheritTimelines = input.readBoolean();
                let sequence = this.readSequence(input);
                let width = 0, height = 0;
                if (nonessential) {
                    width = input.readFloat();
                    height = input.readFloat();
                }
                if (!path)
                    path = name;
                let mesh = this.attachmentLoader.newMeshAttachment(skin, name, path, sequence);
                if (!mesh)
                    return null;
                mesh.path = path;
                Color.rgba8888ToColor(mesh.color, color);
                mesh.sequence = sequence;
                if (nonessential) {
                    mesh.width = width * scale;
                    mesh.height = height * scale;
                }
                this.linkedMeshes.push(new LinkedMesh(mesh, skinName, slotIndex, parent, inheritTimelines));
                return mesh;
            }
            case AttachmentType.Path: {
                let closed = input.readBoolean();
                let constantSpeed = input.readBoolean();
                let vertexCount = input.readInt(true);
                let vertices = this.readVertices(input, vertexCount);
                let lengths = Utils.newArray(vertexCount / 3, 0);
                for (let i = 0, n = lengths.length; i < n; i++)
                    lengths[i] = input.readFloat() * scale;
                let color = nonessential ? input.readInt32() : 0;
                let path = this.attachmentLoader.newPathAttachment(skin, name);
                if (!path)
                    return null;
                path.closed = closed;
                path.constantSpeed = constantSpeed;
                path.worldVerticesLength = vertexCount << 1;
                path.vertices = vertices.vertices;
                path.bones = vertices.bones;
                path.lengths = lengths;
                if (nonessential)
                    Color.rgba8888ToColor(path.color, color);
                return path;
            }
            case AttachmentType.Point: {
                let rotation = input.readFloat();
                let x = input.readFloat();
                let y = input.readFloat();
                let color = nonessential ? input.readInt32() : 0;
                let point = this.attachmentLoader.newPointAttachment(skin, name);
                if (!point)
                    return null;
                point.x = x * scale;
                point.y = y * scale;
                point.rotation = rotation;
                if (nonessential)
                    Color.rgba8888ToColor(point.color, color);
                return point;
            }
            case AttachmentType.Clipping: {
                let endSlotIndex = input.readInt(true);
                let vertexCount = input.readInt(true);
                let vertices = this.readVertices(input, vertexCount);
                let color = nonessential ? input.readInt32() : 0;
                let clip = this.attachmentLoader.newClippingAttachment(skin, name);
                if (!clip)
                    return null;
                clip.endSlot = skeletonData.slots[endSlotIndex];
                clip.worldVerticesLength = vertexCount << 1;
                clip.vertices = vertices.vertices;
                clip.bones = vertices.bones;
                if (nonessential)
                    Color.rgba8888ToColor(clip.color, color);
                return clip;
            }
        }
        return null;
    }
    readSequence(input) {
        if (!input.readBoolean())
            return null;
        let sequence = new Sequence(input.readInt(true));
        sequence.start = input.readInt(true);
        sequence.digits = input.readInt(true);
        sequence.setupIndex = input.readInt(true);
        return sequence;
    }
    readVertices(input, vertexCount) {
        let scale = this.scale;
        let verticesLength = vertexCount << 1;
        let vertices = new Vertices();
        if (!input.readBoolean()) {
            vertices.vertices = this.readFloatArray(input, verticesLength, scale);
            return vertices;
        }
        let weights = new Array();
        let bonesArray = new Array();
        for (let i = 0; i < vertexCount; i++) {
            let boneCount = input.readInt(true);
            bonesArray.push(boneCount);
            for (let ii = 0; ii < boneCount; ii++) {
                bonesArray.push(input.readInt(true));
                weights.push(input.readFloat() * scale);
                weights.push(input.readFloat() * scale);
                weights.push(input.readFloat());
            }
        }
        vertices.vertices = Utils.toFloatArray(weights);
        vertices.bones = bonesArray;
        return vertices;
    }
    readFloatArray(input, n, scale) {
        let array = new Array(n);
        if (scale == 1) {
            for (let i = 0; i < n; i++)
                array[i] = input.readFloat();
        }
        else {
            for (let i = 0; i < n; i++)
                array[i] = input.readFloat() * scale;
        }
        return array;
    }
    readShortArray(input) {
        let n = input.readInt(true);
        let array = new Array(n);
        for (let i = 0; i < n; i++)
            array[i] = input.readShort();
        return array;
    }
    readAnimation(input, name, skeletonData) {
        input.readInt(true); // Number of timelines.
        let timelines = new Array();
        let scale = this.scale;
        let tempColor1 = new Color();
        let tempColor2 = new Color();
        // Slot timelines.
        for (let i = 0, n = input.readInt(true); i < n; i++) {
            let slotIndex = input.readInt(true);
            for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
                let timelineType = input.readByte();
                let frameCount = input.readInt(true);
                let frameLast = frameCount - 1;
                switch (timelineType) {
                    case SLOT_ATTACHMENT: {
                        let timeline = new AttachmentTimeline(frameCount, slotIndex);
                        for (let frame = 0; frame < frameCount; frame++)
                            timeline.setFrame(frame, input.readFloat(), input.readStringRef());
                        timelines.push(timeline);
                        break;
                    }
                    case SLOT_RGBA: {
                        let bezierCount = input.readInt(true);
                        let timeline = new RGBATimeline(frameCount, bezierCount, slotIndex);
                        let time = input.readFloat();
                        let r = input.readUnsignedByte() / 255.0;
                        let g = input.readUnsignedByte() / 255.0;
                        let b = input.readUnsignedByte() / 255.0;
                        let a = input.readUnsignedByte() / 255.0;
                        for (let frame = 0, bezier = 0;; frame++) {
                            timeline.setFrame(frame, time, r, g, b, a);
                            if (frame == frameLast)
                                break;
                            let time2 = input.readFloat();
                            let r2 = input.readUnsignedByte() / 255.0;
                            let g2 = input.readUnsignedByte() / 255.0;
                            let b2 = input.readUnsignedByte() / 255.0;
                            let a2 = input.readUnsignedByte() / 255.0;
                            switch (input.readByte()) {
                                case CURVE_STEPPED:
                                    timeline.setStepped(frame);
                                    break;
                                case CURVE_BEZIER:
                                    setBezier(input, timeline, bezier++, frame, 0, time, time2, r, r2, 1);
                                    setBezier(input, timeline, bezier++, frame, 1, time, time2, g, g2, 1);
                                    setBezier(input, timeline, bezier++, frame, 2, time, time2, b, b2, 1);
                                    setBezier(input, timeline, bezier++, frame, 3, time, time2, a, a2, 1);
                            }
                            time = time2;
                            r = r2;
                            g = g2;
                            b = b2;
                            a = a2;
                        }
                        timelines.push(timeline);
                        break;
                    }
                    case SLOT_RGB: {
                        let bezierCount = input.readInt(true);
                        let timeline = new RGBTimeline(frameCount, bezierCount, slotIndex);
                        let time = input.readFloat();
                        let r = input.readUnsignedByte() / 255.0;
                        let g = input.readUnsignedByte() / 255.0;
                        let b = input.readUnsignedByte() / 255.0;
                        for (let frame = 0, bezier = 0;; frame++) {
                            timeline.setFrame(frame, time, r, g, b);
                            if (frame == frameLast)
                                break;
                            let time2 = input.readFloat();
                            let r2 = input.readUnsignedByte() / 255.0;
                            let g2 = input.readUnsignedByte() / 255.0;
                            let b2 = input.readUnsignedByte() / 255.0;
                            switch (input.readByte()) {
                                case CURVE_STEPPED:
                                    timeline.setStepped(frame);
                                    break;
                                case CURVE_BEZIER:
                                    setBezier(input, timeline, bezier++, frame, 0, time, time2, r, r2, 1);
                                    setBezier(input, timeline, bezier++, frame, 1, time, time2, g, g2, 1);
                                    setBezier(input, timeline, bezier++, frame, 2, time, time2, b, b2, 1);
                            }
                            time = time2;
                            r = r2;
                            g = g2;
                            b = b2;
                        }
                        timelines.push(timeline);
                        break;
                    }
                    case SLOT_RGBA2: {
                        let bezierCount = input.readInt(true);
                        let timeline = new RGBA2Timeline(frameCount, bezierCount, slotIndex);
                        let time = input.readFloat();
                        let r = input.readUnsignedByte() / 255.0;
                        let g = input.readUnsignedByte() / 255.0;
                        let b = input.readUnsignedByte() / 255.0;
                        let a = input.readUnsignedByte() / 255.0;
                        let r2 = input.readUnsignedByte() / 255.0;
                        let g2 = input.readUnsignedByte() / 255.0;
                        let b2 = input.readUnsignedByte() / 255.0;
                        for (let frame = 0, bezier = 0;; frame++) {
                            timeline.setFrame(frame, time, r, g, b, a, r2, g2, b2);
                            if (frame == frameLast)
                                break;
                            let time2 = input.readFloat();
                            let nr = input.readUnsignedByte() / 255.0;
                            let ng = input.readUnsignedByte() / 255.0;
                            let nb = input.readUnsignedByte() / 255.0;
                            let na = input.readUnsignedByte() / 255.0;
                            let nr2 = input.readUnsignedByte() / 255.0;
                            let ng2 = input.readUnsignedByte() / 255.0;
                            let nb2 = input.readUnsignedByte() / 255.0;
                            switch (input.readByte()) {
                                case CURVE_STEPPED:
                                    timeline.setStepped(frame);
                                    break;
                                case CURVE_BEZIER:
                                    setBezier(input, timeline, bezier++, frame, 0, time, time2, r, nr, 1);
                                    setBezier(input, timeline, bezier++, frame, 1, time, time2, g, ng, 1);
                                    setBezier(input, timeline, bezier++, frame, 2, time, time2, b, nb, 1);
                                    setBezier(input, timeline, bezier++, frame, 3, time, time2, a, na, 1);
                                    setBezier(input, timeline, bezier++, frame, 4, time, time2, r2, nr2, 1);
                                    setBezier(input, timeline, bezier++, frame, 5, time, time2, g2, ng2, 1);
                                    setBezier(input, timeline, bezier++, frame, 6, time, time2, b2, nb2, 1);
                            }
                            time = time2;
                            r = nr;
                            g = ng;
                            b = nb;
                            a = na;
                            r2 = nr2;
                            g2 = ng2;
                            b2 = nb2;
                        }
                        timelines.push(timeline);
                        break;
                    }
                    case SLOT_RGB2: {
                        let bezierCount = input.readInt(true);
                        let timeline = new RGB2Timeline(frameCount, bezierCount, slotIndex);
                        let time = input.readFloat();
                        let r = input.readUnsignedByte() / 255.0;
                        let g = input.readUnsignedByte() / 255.0;
                        let b = input.readUnsignedByte() / 255.0;
                        let r2 = input.readUnsignedByte() / 255.0;
                        let g2 = input.readUnsignedByte() / 255.0;
                        let b2 = input.readUnsignedByte() / 255.0;
                        for (let frame = 0, bezier = 0;; frame++) {
                            timeline.setFrame(frame, time, r, g, b, r2, g2, b2);
                            if (frame == frameLast)
                                break;
                            let time2 = input.readFloat();
                            let nr = input.readUnsignedByte() / 255.0;
                            let ng = input.readUnsignedByte() / 255.0;
                            let nb = input.readUnsignedByte() / 255.0;
                            let nr2 = input.readUnsignedByte() / 255.0;
                            let ng2 = input.readUnsignedByte() / 255.0;
                            let nb2 = input.readUnsignedByte() / 255.0;
                            switch (input.readByte()) {
                                case CURVE_STEPPED:
                                    timeline.setStepped(frame);
                                    break;
                                case CURVE_BEZIER:
                                    setBezier(input, timeline, bezier++, frame, 0, time, time2, r, nr, 1);
                                    setBezier(input, timeline, bezier++, frame, 1, time, time2, g, ng, 1);
                                    setBezier(input, timeline, bezier++, frame, 2, time, time2, b, nb, 1);
                                    setBezier(input, timeline, bezier++, frame, 3, time, time2, r2, nr2, 1);
                                    setBezier(input, timeline, bezier++, frame, 4, time, time2, g2, ng2, 1);
                                    setBezier(input, timeline, bezier++, frame, 5, time, time2, b2, nb2, 1);
                            }
                            time = time2;
                            r = nr;
                            g = ng;
                            b = nb;
                            r2 = nr2;
                            g2 = ng2;
                            b2 = nb2;
                        }
                        timelines.push(timeline);
                        break;
                    }
                    case SLOT_ALPHA: {
                        let timeline = new AlphaTimeline(frameCount, input.readInt(true), slotIndex);
                        let time = input.readFloat(), a = input.readUnsignedByte() / 255;
                        for (let frame = 0, bezier = 0;; frame++) {
                            timeline.setFrame(frame, time, a);
                            if (frame == frameLast)
                                break;
                            let time2 = input.readFloat();
                            let a2 = input.readUnsignedByte() / 255;
                            switch (input.readByte()) {
                                case CURVE_STEPPED:
                                    timeline.setStepped(frame);
                                    break;
                                case CURVE_BEZIER:
                                    setBezier(input, timeline, bezier++, frame, 0, time, time2, a, a2, 1);
                            }
                            time = time2;
                            a = a2;
                        }
                        timelines.push(timeline);
                    }
                }
            }
        }
        // Bone timelines.
        for (let i = 0, n = input.readInt(true); i < n; i++) {
            let boneIndex = input.readInt(true);
            for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
                let type = input.readByte(), frameCount = input.readInt(true), bezierCount = input.readInt(true);
                switch (type) {
                    case BONE_ROTATE:
                        timelines.push(readTimeline1(input, new RotateTimeline(frameCount, bezierCount, boneIndex), 1));
                        break;
                    case BONE_TRANSLATE:
                        timelines.push(readTimeline2(input, new TranslateTimeline(frameCount, bezierCount, boneIndex), scale));
                        break;
                    case BONE_TRANSLATEX:
                        timelines.push(readTimeline1(input, new TranslateXTimeline(frameCount, bezierCount, boneIndex), scale));
                        break;
                    case BONE_TRANSLATEY:
                        timelines.push(readTimeline1(input, new TranslateYTimeline(frameCount, bezierCount, boneIndex), scale));
                        break;
                    case BONE_SCALE:
                        timelines.push(readTimeline2(input, new ScaleTimeline(frameCount, bezierCount, boneIndex), 1));
                        break;
                    case BONE_SCALEX:
                        timelines.push(readTimeline1(input, new ScaleXTimeline(frameCount, bezierCount, boneIndex), 1));
                        break;
                    case BONE_SCALEY:
                        timelines.push(readTimeline1(input, new ScaleYTimeline(frameCount, bezierCount, boneIndex), 1));
                        break;
                    case BONE_SHEAR:
                        timelines.push(readTimeline2(input, new ShearTimeline(frameCount, bezierCount, boneIndex), 1));
                        break;
                    case BONE_SHEARX:
                        timelines.push(readTimeline1(input, new ShearXTimeline(frameCount, bezierCount, boneIndex), 1));
                        break;
                    case BONE_SHEARY:
                        timelines.push(readTimeline1(input, new ShearYTimeline(frameCount, bezierCount, boneIndex), 1));
                }
            }
        }
        // IK constraint timelines.
        for (let i = 0, n = input.readInt(true); i < n; i++) {
            let index = input.readInt(true), frameCount = input.readInt(true), frameLast = frameCount - 1;
            let timeline = new IkConstraintTimeline(frameCount, input.readInt(true), index);
            let time = input.readFloat(), mix = input.readFloat(), softness = input.readFloat() * scale;
            for (let frame = 0, bezier = 0;; frame++) {
                timeline.setFrame(frame, time, mix, softness, input.readByte(), input.readBoolean(), input.readBoolean());
                if (frame == frameLast)
                    break;
                let time2 = input.readFloat(), mix2 = input.readFloat(), softness2 = input.readFloat() * scale;
                switch (input.readByte()) {
                    case CURVE_STEPPED:
                        timeline.setStepped(frame);
                        break;
                    case CURVE_BEZIER:
                        setBezier(input, timeline, bezier++, frame, 0, time, time2, mix, mix2, 1);
                        setBezier(input, timeline, bezier++, frame, 1, time, time2, softness, softness2, scale);
                }
                time = time2;
                mix = mix2;
                softness = softness2;
            }
            timelines.push(timeline);
        }
        // Transform constraint timelines.
        for (let i = 0, n = input.readInt(true); i < n; i++) {
            let index = input.readInt(true), frameCount = input.readInt(true), frameLast = frameCount - 1;
            let timeline = new TransformConstraintTimeline(frameCount, input.readInt(true), index);
            let time = input.readFloat(), mixRotate = input.readFloat(), mixX = input.readFloat(), mixY = input.readFloat(), mixScaleX = input.readFloat(), mixScaleY = input.readFloat(), mixShearY = input.readFloat();
            for (let frame = 0, bezier = 0;; frame++) {
                timeline.setFrame(frame, time, mixRotate, mixX, mixY, mixScaleX, mixScaleY, mixShearY);
                if (frame == frameLast)
                    break;
                let time2 = input.readFloat(), mixRotate2 = input.readFloat(), mixX2 = input.readFloat(), mixY2 = input.readFloat(), mixScaleX2 = input.readFloat(), mixScaleY2 = input.readFloat(), mixShearY2 = input.readFloat();
                switch (input.readByte()) {
                    case CURVE_STEPPED:
                        timeline.setStepped(frame);
                        break;
                    case CURVE_BEZIER:
                        setBezier(input, timeline, bezier++, frame, 0, time, time2, mixRotate, mixRotate2, 1);
                        setBezier(input, timeline, bezier++, frame, 1, time, time2, mixX, mixX2, 1);
                        setBezier(input, timeline, bezier++, frame, 2, time, time2, mixY, mixY2, 1);
                        setBezier(input, timeline, bezier++, frame, 3, time, time2, mixScaleX, mixScaleX2, 1);
                        setBezier(input, timeline, bezier++, frame, 4, time, time2, mixScaleY, mixScaleY2, 1);
                        setBezier(input, timeline, bezier++, frame, 5, time, time2, mixShearY, mixShearY2, 1);
                }
                time = time2;
                mixRotate = mixRotate2;
                mixX = mixX2;
                mixY = mixY2;
                mixScaleX = mixScaleX2;
                mixScaleY = mixScaleY2;
                mixShearY = mixShearY2;
            }
            timelines.push(timeline);
        }
        // Path constraint timelines.
        for (let i = 0, n = input.readInt(true); i < n; i++) {
            let index = input.readInt(true);
            let data = skeletonData.pathConstraints[index];
            for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
                switch (input.readByte()) {
                    case PATH_POSITION:
                        timelines
                            .push(readTimeline1(input, new PathConstraintPositionTimeline(input.readInt(true), input.readInt(true), index), data.positionMode == PositionMode.Fixed ? scale : 1));
                        break;
                    case PATH_SPACING:
                        timelines
                            .push(readTimeline1(input, new PathConstraintSpacingTimeline(input.readInt(true), input.readInt(true), index), data.spacingMode == SpacingMode.Length || data.spacingMode == SpacingMode.Fixed ? scale : 1));
                        break;
                    case PATH_MIX:
                        let timeline = new PathConstraintMixTimeline(input.readInt(true), input.readInt(true), index);
                        let time = input.readFloat(), mixRotate = input.readFloat(), mixX = input.readFloat(), mixY = input.readFloat();
                        for (let frame = 0, bezier = 0, frameLast = timeline.getFrameCount() - 1;; frame++) {
                            timeline.setFrame(frame, time, mixRotate, mixX, mixY);
                            if (frame == frameLast)
                                break;
                            let time2 = input.readFloat(), mixRotate2 = input.readFloat(), mixX2 = input.readFloat(), mixY2 = input.readFloat();
                            switch (input.readByte()) {
                                case CURVE_STEPPED:
                                    timeline.setStepped(frame);
                                    break;
                                case CURVE_BEZIER:
                                    setBezier(input, timeline, bezier++, frame, 0, time, time2, mixRotate, mixRotate2, 1);
                                    setBezier(input, timeline, bezier++, frame, 1, time, time2, mixX, mixX2, 1);
                                    setBezier(input, timeline, bezier++, frame, 2, time, time2, mixY, mixY2, 1);
                            }
                            time = time2;
                            mixRotate = mixRotate2;
                            mixX = mixX2;
                            mixY = mixY2;
                        }
                        timelines.push(timeline);
                }
            }
        }
        // Deform timelines.
        for (let i = 0, n = input.readInt(true); i < n; i++) {
            let skin = skeletonData.skins[input.readInt(true)];
            for (let ii = 0, nn = input.readInt(true); ii < nn; ii++) {
                let slotIndex = input.readInt(true);
                for (let iii = 0, nnn = input.readInt(true); iii < nnn; iii++) {
                    let attachmentName = input.readStringRef();
                    if (!attachmentName)
                        throw new Error("attachmentName must not be null.");
                    let attachment = skin.getAttachment(slotIndex, attachmentName);
                    let timelineType = input.readByte();
                    let frameCount = input.readInt(true);
                    let frameLast = frameCount - 1;
                    switch (timelineType) {
                        case ATTACHMENT_DEFORM: {
                            let vertexAttachment = attachment;
                            let weighted = vertexAttachment.bones;
                            let vertices = vertexAttachment.vertices;
                            let deformLength = weighted ? vertices.length / 3 * 2 : vertices.length;
                            let bezierCount = input.readInt(true);
                            let timeline = new DeformTimeline(frameCount, bezierCount, slotIndex, vertexAttachment);
                            let time = input.readFloat();
                            for (let frame = 0, bezier = 0;; frame++) {
                                let deform;
                                let end = input.readInt(true);
                                if (end == 0)
                                    deform = weighted ? Utils.newFloatArray(deformLength) : vertices;
                                else {
                                    deform = Utils.newFloatArray(deformLength);
                                    let start = input.readInt(true);
                                    end += start;
                                    if (scale == 1) {
                                        for (let v = start; v < end; v++)
                                            deform[v] = input.readFloat();
                                    }
                                    else {
                                        for (let v = start; v < end; v++)
                                            deform[v] = input.readFloat() * scale;
                                    }
                                    if (!weighted) {
                                        for (let v = 0, vn = deform.length; v < vn; v++)
                                            deform[v] += vertices[v];
                                    }
                                }
                                timeline.setFrame(frame, time, deform);
                                if (frame == frameLast)
                                    break;
                                let time2 = input.readFloat();
                                switch (input.readByte()) {
                                    case CURVE_STEPPED:
                                        timeline.setStepped(frame);
                                        break;
                                    case CURVE_BEZIER:
                                        setBezier(input, timeline, bezier++, frame, 0, time, time2, 0, 1, 1);
                                }
                                time = time2;
                            }
                            timelines.push(timeline);
                            break;
                        }
                        case ATTACHMENT_SEQUENCE: {
                            let timeline = new SequenceTimeline(frameCount, slotIndex, attachment);
                            for (let frame = 0; frame < frameCount; frame++) {
                                let time = input.readFloat();
                                let modeAndIndex = input.readInt32();
                                timeline.setFrame(frame, time, SequenceModeValues[modeAndIndex & 0xf], modeAndIndex >> 4, input.readFloat());
                            }
                            timelines.push(timeline);
                            break;
                        }
                    }
                }
            }
        }
        // Draw order timeline.
        let drawOrderCount = input.readInt(true);
        if (drawOrderCount > 0) {
            let timeline = new DrawOrderTimeline(drawOrderCount);
            let slotCount = skeletonData.slots.length;
            for (let i = 0; i < drawOrderCount; i++) {
                let time = input.readFloat();
                let offsetCount = input.readInt(true);
                let drawOrder = Utils.newArray(slotCount, 0);
                for (let ii = slotCount - 1; ii >= 0; ii--)
                    drawOrder[ii] = -1;
                let unchanged = Utils.newArray(slotCount - offsetCount, 0);
                let originalIndex = 0, unchangedIndex = 0;
                for (let ii = 0; ii < offsetCount; ii++) {
                    let slotIndex = input.readInt(true);
                    // Collect unchanged items.
                    while (originalIndex != slotIndex)
                        unchanged[unchangedIndex++] = originalIndex++;
                    // Set changed items.
                    drawOrder[originalIndex + input.readInt(true)] = originalIndex++;
                }
                // Collect remaining unchanged items.
                while (originalIndex < slotCount)
                    unchanged[unchangedIndex++] = originalIndex++;
                // Fill in unchanged items.
                for (let ii = slotCount - 1; ii >= 0; ii--)
                    if (drawOrder[ii] == -1)
                        drawOrder[ii] = unchanged[--unchangedIndex];
                timeline.setFrame(i, time, drawOrder);
            }
            timelines.push(timeline);
        }
        // Event timeline.
        let eventCount = input.readInt(true);
        if (eventCount > 0) {
            let timeline = new EventTimeline(eventCount);
            for (let i = 0; i < eventCount; i++) {
                let time = input.readFloat();
                let eventData = skeletonData.events[input.readInt(true)];
                let event = new Event(time, eventData);
                event.intValue = input.readInt(false);
                event.floatValue = input.readFloat();
                event.stringValue = input.readBoolean() ? input.readString() : eventData.stringValue;
                if (event.data.audioPath) {
                    event.volume = input.readFloat();
                    event.balance = input.readFloat();
                }
                timeline.setFrame(i, event);
            }
            timelines.push(timeline);
        }
        let duration = 0;
        for (let i = 0, n = timelines.length; i < n; i++)
            duration = Math.max(duration, timelines[i].getDuration());
        return new Animation(name, timelines, duration);
    }
}
export class BinaryInput {
    strings;
    index;
    buffer;
    constructor(data, strings = new Array(), index = 0, buffer = new DataView(data.buffer)) {
        this.strings = strings;
        this.index = index;
        this.buffer = buffer;
    }
    readByte() {
        return this.buffer.getInt8(this.index++);
    }
    readUnsignedByte() {
        return this.buffer.getUint8(this.index++);
    }
    readShort() {
        let value = this.buffer.getInt16(this.index);
        this.index += 2;
        return value;
    }
    readInt32() {
        let value = this.buffer.getInt32(this.index);
        this.index += 4;
        return value;
    }
    readInt(optimizePositive) {
        let b = this.readByte();
        let result = b & 0x7F;
        if ((b & 0x80) != 0) {
            b = this.readByte();
            result |= (b & 0x7F) << 7;
            if ((b & 0x80) != 0) {
                b = this.readByte();
                result |= (b & 0x7F) << 14;
                if ((b & 0x80) != 0) {
                    b = this.readByte();
                    result |= (b & 0x7F) << 21;
                    if ((b & 0x80) != 0) {
                        b = this.readByte();
                        result |= (b & 0x7F) << 28;
                    }
                }
            }
        }
        return optimizePositive ? result : ((result >>> 1) ^ -(result & 1));
    }
    readStringRef() {
        let index = this.readInt(true);
        return index == 0 ? null : this.strings[index - 1];
    }
    readString() {
        let byteCount = this.readInt(true);
        switch (byteCount) {
            case 0:
                return null;
            case 1:
                return "";
        }
        byteCount--;
        let chars = "";
        let charCount = 0;
        for (let i = 0; i < byteCount;) {
            let b = this.readUnsignedByte();
            switch (b >> 4) {
                case 12:
                case 13:
                    chars += String.fromCharCode(((b & 0x1F) << 6 | this.readByte() & 0x3F));
                    i += 2;
                    break;
                case 14:
                    chars += String.fromCharCode(((b & 0x0F) << 12 | (this.readByte() & 0x3F) << 6 | this.readByte() & 0x3F));
                    i += 3;
                    break;
                default:
                    chars += String.fromCharCode(b);
                    i++;
            }
        }
        return chars;
    }
    readFloat() {
        let value = this.buffer.getFloat32(this.index);
        this.index += 4;
        return value;
    }
    readBoolean() {
        return this.readByte() != 0;
    }
}
class LinkedMesh {
    parent;
    skin;
    slotIndex;
    mesh;
    inheritTimeline;
    constructor(mesh, skin, slotIndex, parent, inheritDeform) {
        this.mesh = mesh;
        this.skin = skin;
        this.slotIndex = slotIndex;
        this.parent = parent;
        this.inheritTimeline = inheritDeform;
    }
}
class Vertices {
    bones;
    vertices;
    constructor(bones = null, vertices = null) {
        this.bones = bones;
        this.vertices = vertices;
    }
}
var AttachmentType;
(function (AttachmentType) {
    AttachmentType[AttachmentType["Region"] = 0] = "Region";
    AttachmentType[AttachmentType["BoundingBox"] = 1] = "BoundingBox";
    AttachmentType[AttachmentType["Mesh"] = 2] = "Mesh";
    AttachmentType[AttachmentType["LinkedMesh"] = 3] = "LinkedMesh";
    AttachmentType[AttachmentType["Path"] = 4] = "Path";
    AttachmentType[AttachmentType["Point"] = 5] = "Point";
    AttachmentType[AttachmentType["Clipping"] = 6] = "Clipping";
})(AttachmentType || (AttachmentType = {}));
function readTimeline1(input, timeline, scale) {
    let time = input.readFloat(), value = input.readFloat() * scale;
    for (let frame = 0, bezier = 0, frameLast = timeline.getFrameCount() - 1;; frame++) {
        timeline.setFrame(frame, time, value);
        if (frame == frameLast)
            break;
        let time2 = input.readFloat(), value2 = input.readFloat() * scale;
        switch (input.readByte()) {
            case CURVE_STEPPED:
                timeline.setStepped(frame);
                break;
            case CURVE_BEZIER:
                setBezier(input, timeline, bezier++, frame, 0, time, time2, value, value2, scale);
        }
        time = time2;
        value = value2;
    }
    return timeline;
}
function readTimeline2(input, timeline, scale) {
    let time = input.readFloat(), value1 = input.readFloat() * scale, value2 = input.readFloat() * scale;
    for (let frame = 0, bezier = 0, frameLast = timeline.getFrameCount() - 1;; frame++) {
        timeline.setFrame(frame, time, value1, value2);
        if (frame == frameLast)
            break;
        let time2 = input.readFloat(), nvalue1 = input.readFloat() * scale, nvalue2 = input.readFloat() * scale;
        switch (input.readByte()) {
            case CURVE_STEPPED:
                timeline.setStepped(frame);
                break;
            case CURVE_BEZIER:
                setBezier(input, timeline, bezier++, frame, 0, time, time2, value1, nvalue1, scale);
                setBezier(input, timeline, bezier++, frame, 1, time, time2, value2, nvalue2, scale);
        }
        time = time2;
        value1 = nvalue1;
        value2 = nvalue2;
    }
    return timeline;
}
function setBezier(input, timeline, bezier, frame, value, time1, time2, value1, value2, scale) {
    timeline.setBezier(bezier, frame, value, time1, value1, input.readFloat(), input.readFloat() * scale, input.readFloat(), input.readFloat() * scale, time2, value2);
}
const BONE_ROTATE = 0;
const BONE_TRANSLATE = 1;
const BONE_TRANSLATEX = 2;
const BONE_TRANSLATEY = 3;
const BONE_SCALE = 4;
const BONE_SCALEX = 5;
const BONE_SCALEY = 6;
const BONE_SHEAR = 7;
const BONE_SHEARX = 8;
const BONE_SHEARY = 9;
const SLOT_ATTACHMENT = 0;
const SLOT_RGBA = 1;
const SLOT_RGB = 2;
const SLOT_RGBA2 = 3;
const SLOT_RGB2 = 4;
const SLOT_ALPHA = 5;
const ATTACHMENT_DEFORM = 0;
const ATTACHMENT_SEQUENCE = 1;
const PATH_POSITION = 0;
const PATH_SPACING = 1;
const PATH_MIX = 2;
const CURVE_LINEAR = 0;
const CURVE_STEPPED = 1;
const CURVE_BEZIER = 2;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2tlbGV0b25CaW5hcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvU2tlbGV0b25CaW5hcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRS9FLE9BQU8sRUFBRSxTQUFTLEVBQVksa0JBQWtCLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsYUFBYSxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsb0JBQW9CLEVBQUUsMkJBQTJCLEVBQUUsOEJBQThCLEVBQUUsNkJBQTZCLEVBQUUseUJBQXlCLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBaUQsZ0JBQWdCLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUt6akIsT0FBTyxFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ3pFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLFlBQVksQ0FBQztBQUNuQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDM0MsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDekQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN4RixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNqQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8s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QWdCLEVBQUUsR0FBRyxLQUFLLENBQUM7d0JBQ3pDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEtBQUssQ0FBQzt3QkFDekMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsS0FBSyxDQUFDO3dCQUN6QyxJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxLQUFLLENBQUM7d0JBQzFDLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEtBQUssQ0FBQzt3QkFDMUMsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsS0FBSyxDQUFDO3dCQUUxQyxLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsQ0FBQyxHQUFJLEtBQUssRUFBRSxFQUFFOzRCQUMxQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7NEJBQ3ZELElBQUksS0FBSyxJQUFJLFNBQVM7Z0NBQUUsTUFBTTs0QkFDOUIsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDOzRCQUM5QixJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxLQUFLLENBQUM7NEJBQzFDLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEtBQUssQ0FBQzs0QkFDMUMsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsS0FBSyxDQUFDOzRCQUMxQyxJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxLQUFLLENBQUM7NEJBQzFDLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEtBQUssQ0FBQzs0QkFDM0Ms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LENBQUMsUUFBUSxFQUFFLEVBQUU7b0JBQ3pCLEtBQUssYUFBYTt3QkFDakIsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDM0IsTUFBTTtvQkFDUCxLQUFLLFlBQVk7d0JBQ2hCLFNBQVMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN0RixTQUFTLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDNUUsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQzVFLFNBQVMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN0RixTQUFTLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDdEYsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7aUJBQ3ZGO2dCQUNELElBQUksR0FBRyxLQUFLLENB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