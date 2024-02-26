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
import { Animation, MixBlend, AttachmentTimeline, MixDirection, RotateTimeline, DrawOrderTimeline, Timeline, EventTimeline } from "./Animation.js";
import { StringSet, Pool, Utils, MathUtils } from "./Utils.js";
/** Applies animations over time, queues animations for later playback, mixes (crossfading) between animations, and applies
 * multiple animations on top of each other (layering).
 *
 * See [Applying Animations](http://esotericsoftware.com/spine-applying-animations/) in the Spine Runtimes Guide. */
export class AnimationState {
    static _emptyAnimation = new Animation("<empty>", [], 0);
    static emptyAnimation() {
        return AnimationState._emptyAnimation;
    }
    /** The AnimationStateData to look up mix durations. */
    data;
    /** The list of tracks that currently have animations, which may contain null entries. */
    tracks = new Array();
    /** Multiplier for the delta time when the animation state is updated, causing time for all animations and mixes to play slower
     * or faster. Defaults to 1.
     *
     * See TrackEntry {@link TrackEntry#timeScale} for affecting a single animation. */
    timeScale = 1;
    unkeyedState = 0;
    events = new Array();
    listeners = new Array();
    queue = new EventQueue(this);
    propertyIDs = new StringSet();
    animationsChanged = false;
    trackEntryPool = new Pool(() => new TrackEntry());
    constructor(data) {
        this.data = data;
    }
    /** Increments each track entry {@link TrackEntry#trackTime()}, setting queued animations as current if needed. */
    update(delta) {
        delta *= this.timeScale;
        let tracks = this.tracks;
        for (let i = 0, n = tracks.length; i < n; i++) {
            let current = tracks[i];
            if (!current)
                continue;
            current.animationLast = current.nextAnimationLast;
            current.trackLast = current.nextTrackLast;
            let currentDelta = delta * current.timeScale;
            if (current.delay > 0) {
                current.delay -= currentDelta;
                if (current.delay > 0)
                    continue;
                currentDelta = -current.delay;
                current.delay = 0;
            }
            let next = current.next;
            if (next) {
                // When the next entry's delay is passed, change to the next entry, preserving leftover time.
                let nextTime = current.trackLast - next.delay;
                if (nextTime >= 0) {
                    next.delay = 0;
                    next.trackTime += current.timeScale == 0 ? 0 : (nextTime / current.timeScale + delta) * next.timeScale;
                    current.trackTime += currentDelta;
                    this.setCurrent(i, next, true);
                    while (next.mixingFrom) {
                        next.mixTime += delta;
                        next = next.mixingFrom;
                    }
                    continue;
                }
            }
            else if (current.trackLast >= current.trackEnd && !current.mixingFrom) {
                tracks[i] = null;
                this.queue.end(current);
                this.clearNext(current);
                continue;
            }
            if (current.mixingFrom && this.updateMixingFrom(current, delta)) {
                // End mixing from entries once all have completed.
                let from = current.mixingFrom;
                current.mixingFrom = null;
                if (from)
                    from.mixingTo = null;
                while (from) {
                    this.queue.end(from);
                    from = from.mixingFrom;
                }
            }
            current.trackTime += currentDelta;
        }
        this.queue.drain();
    }
    /** Returns true when all mixing from entries are complete. */
    updateMixingFrom(to, delta) {
        let from = to.mixingFrom;
        if (!from)
            return true;
        let finished = this.updateMixingFrom(from, delta);
        from.animationLast = from.nextAnimationLast;
        from.trackLast = from.nextTrackLast;
        // Require mixTime > 0 to ensure the mixing from entry was applied at least once.
        if (to.mixTime > 0 && to.mixTime >= to.mixDuration) {
            // Require totalAlpha == 0 to ensure mixing is complete, unless mixDuration == 0 (the transition is a single frame).
            if (from.totalAlpha == 0 || to.mixDuration == 0) {
                to.mixingFrom = from.mixingFrom;
                if (from.mixingFrom)
                    from.mixingFrom.mixingTo = to;
                to.interruptAlpha = from.interruptAlpha;
                this.queue.end(from);
            }
            return finished;
        }
        from.trackTime += delta * from.timeScale;
        to.mixTime += delta;
        return false;
    }
    /** Poses the skeleton using the track entry animations. There are no side effects other than invoking listeners, so the
     * animation state can be applied to multiple skeletons to pose them identically.
     * @returns True if any animations were applied. */
    apply(skeleton) {
        if (!skeleton)
            throw new Error("skeleton cannot be null.");
        if (this.animationsChanged)
            this._animationsChanged();
        let events = this.events;
        let tracks = this.tracks;
        let applied = false;
        for (let i = 0, n = tracks.length; i < n; i++) {
            let current = tracks[i];
            if (!current || current.delay > 0)
                continue;
            applied = true;
            let blend = i == 0 ? MixBlend.first : current.mixBlend;
            // Apply mixing from entries first.
            let mix = current.alpha;
            if (current.mixingFrom)
                mix *= this.applyMixingFrom(current, skeleton, blend);
            else if (current.trackTime >= current.trackEnd && !current.next)
                mix = 0;
            // Apply current entry.
            let animationLast = current.animationLast, animationTime = current.getAnimationTime(), applyTime = animationTime;
            let applyEvents = events;
            if (current.reverse) {
                applyTime = current.animation.duration - applyTime;
                applyEvents = null;
            }
            let timelines = current.animation.timelines;
            let timelineCount = timelines.length;
            if ((i == 0 && mix == 1) || blend == MixBlend.add) {
                for (let ii = 0; ii < timelineCount; ii++) {
                    // Fixes issue #302 on IOS9 where mix, blend sometimes became undefined and caused assets
                    // to sometimes stop rendering when using color correction, as their RGBA values become NaN.
                    // (https://github.com/pixijs/pixi-spine/issues/302)
                    Utils.webkit602BugfixHelper(mix, blend);
                    var timeline = timelines[ii];
                    if (timeline instanceof AttachmentTimeline)
                        this.applyAttachmentTimeline(timeline, skeleton, applyTime, blend, true);
                    else
                        timeline.apply(skeleton, animationLast, applyTime, applyEvents, mix, blend, MixDirection.mixIn);
                }
            }
            else {
                let timelineMode = current.timelineMode;
                let shortestRotation = current.shortestRotation;
                let firstFrame = !shortestRotation && current.timelinesRotation.length != timelineCount << 1;
                if (firstFrame)
                    current.timelinesRotation.length = timelineCount << 1;
                for (let ii = 0; ii < timelineCount; ii++) {
                    let timeline = timelines[ii];
                    let timelineBlend = timelineMode[ii] == SUBSEQUENT ? blend : MixBlend.setup;
                    if (!shortestRotation && timeline instanceof RotateTimeline) {
                        this.applyRotateTimeline(timeline, skeleton, applyTime, mix, timelineBlend, current.timelinesRotation, ii << 1, firstFrame);
                    }
                    else if (timeline instanceof AttachmentTimeline) {
                        this.applyAttachmentTimeline(timeline, skeleton, applyTime, blend, true);
                    }
                    else {
                        // This fixes the WebKit 602 specific issue described at http://esotericsoftware.com/forum/iOS-10-disappearing-graphics-10109
                        Utils.webkit602BugfixHelper(mix, blend);
                        timeline.apply(skeleton, animationLast, applyTime, applyEvents, mix, timelineBlend, MixDirection.mixIn);
                    }
                }
            }
            this.queueEvents(current, animationTime);
            events.length = 0;
            current.nextAnimationLast = animationTime;
            current.nextTrackLast = current.trackTime;
        }
        // Set slots attachments to the setup pose, if needed. This occurs if an animation that is mixing out sets attachments so
        // subsequent timelines see any deform, but the subsequent timelines don't set an attachment (eg they are also mixing out or
        // the time is before the first key).
        var setupState = this.unkeyedState + SETUP;
        var slots = skeleton.slots;
        for (var i = 0, n = skeleton.slots.length; i < n; i++) {
            var slot = slots[i];
            if (slot.attachmentState == setupState) {
                var attachmentName = slot.data.attachmentName;
                slot.setAttachment(!attachmentName ? null : skeleton.getAttachment(slot.data.index, attachmentName));
            }
        }
        this.unkeyedState += 2; // Increasing after each use avoids the need to reset attachmentState for every slot.
        this.queue.drain();
        return applied;
    }
    applyMixingFrom(to, skeleton, blend) {
        let from = to.mixingFrom;
        if (from.mixingFrom)
            this.applyMixingFrom(from, skeleton, blend);
        let mix = 0;
        if (to.mixDuration == 0) { // Single frame mix to undo mixingFrom changes.
            mix = 1;
            if (blend == MixBlend.first)
                blend = MixBlend.setup;
        }
        else {
            mix = to.mixTime / to.mixDuration;
            if (mix > 1)
                mix = 1;
            if (blend != MixBlend.first)
                blend = from.mixBlend;
        }
        let attachments = mix < from.attachmentThreshold, drawOrder = mix < from.drawOrderThreshold;
        let timelines = from.animation.timelines;
        let timelineCount = timelines.length;
        let alphaHold = from.alpha * to.interruptAlpha, alphaMix = alphaHold * (1 - mix);
        let animationLast = from.animationLast, animationTime = from.getAnimationTime(), applyTime = animationTime;
        let events = null;
        if (from.reverse)
            applyTime = from.animation.duration - applyTime;
        else if (mix < from.eventThreshold)
            events = this.events;
        if (blend == MixBlend.add) {
            for (let i = 0; i < timelineCount; i++)
                timelines[i].apply(skeleton, animationLast, applyTime, events, alphaMix, blend, MixDirection.mixOut);
        }
        else {
            let timelineMode = from.timelineMode;
            let timelineHoldMix = from.timelineHoldMix;
            let shortestRotation = from.shortestRotation;
            let firstFrame = !shortestRotation && from.timelinesRotation.length != timelineCount << 1;
            if (firstFrame)
                from.timelinesRotation.length = timelineCount << 1;
            from.totalAlpha = 0;
            for (let i = 0; i < timelineCount; i++) {
                let timeline = timelines[i];
                let direction = MixDirection.mixOut;
                let timelineBlend;
                let alpha = 0;
                switch (timelineMode[i]) {
                    case SUBSEQUENT:
                        if (!drawOrder && timeline instanceof DrawOrderTimeline)
                            continue;
                        timelineBlend = blend;
                        alpha = alphaMix;
                        break;
                    case FIRST:
                        timelineBlend = MixBlend.setup;
                        alpha = alphaMix;
                        break;
                    case HOLD_SUBSEQUENT:
                        timelineBlend = blend;
                        alpha = alphaHold;
                        break;
                    case HOLD_FIRST:
                        timelineBlend = MixBlend.setup;
                        alpha = alphaHold;
                        break;
                    default:
                        timelineBlend = MixBlend.setup;
                        let holdMix = timelineHoldMix[i];
                        alpha = alphaHold * Math.max(0, 1 - holdMix.mixTime / holdMix.mixDuration);
                        break;
                }
                from.totalAlpha += alpha;
                if (!shortestRotation && timeline instanceof RotateTimeline)
                    this.applyRotateTimeline(timeline, skeleton, applyTime, alpha, timelineBlend, from.timelinesRotation, i << 1, firstFrame);
                else if (timeline instanceof AttachmentTimeline)
                    this.applyAttachmentTimeline(timeline, skeleton, applyTime, timelineBlend, attachments);
                else {
                    // This fixes the WebKit 602 specific issue described at http://esotericsoftware.com/forum/iOS-10-disappearing-graphics-10109
                    Utils.webkit602BugfixHelper(alpha, blend);
                    if (drawOrder && timeline instanceof DrawOrderTimeline && timelineBlend == MixBlend.setup)
                        direction = MixDirection.mixIn;
                    timeline.apply(skeleton, animationLast, applyTime, events, alpha, timelineBlend, direction);
                }
            }
        }
        if (to.mixDuration > 0)
            this.queueEvents(from, animationTime);
        this.events.length = 0;
        from.nextAnimationLast = animationTime;
        from.nextTrackLast = from.trackTime;
        return mix;
    }
    applyAttachmentTimeline(timeline, skeleton, time, blend, attachments) {
        var slot = skeleton.slots[timeline.slotIndex];
        if (!slot.bone.active)
            return;
        if (time < timeline.frames[0]) { // Time is before first frame.
            if (blend == MixBlend.setup || blend == MixBlend.first)
                this.setAttachment(skeleton, slot, slot.data.attachmentName, attachments);
        }
        else
            this.setAttachment(skeleton, slot, timeline.attachmentNames[Timeline.search1(timeline.frames, time)], attachments);
        // If an attachment wasn't set (ie before the first frame or attachments is false), set the setup attachment later.
        if (slot.attachmentState <= this.unkeyedState)
            slot.attachmentState = this.unkeyedState + SETUP;
    }
    setAttachment(skeleton, slot, attachmentName, attachments) {
        slot.setAttachment(!attachmentName ? null : skeleton.getAttachment(slot.data.index, attachmentName));
        if (attachments)
            slot.attachmentState = this.unkeyedState + CURRENT;
    }
    applyRotateTimeline(timeline, skeleton, time, alpha, blend, timelinesRotation, i, firstFrame) {
        if (firstFrame)
            timelinesRotation[i] = 0;
        if (alpha == 1) {
            timeline.apply(skeleton, 0, time, null, 1, blend, MixDirection.mixIn);
            return;
        }
        let bone = skeleton.bones[timeline.boneIndex];
        if (!bone.active)
            return;
        let frames = timeline.frames;
        let r1 = 0, r2 = 0;
        if (time < frames[0]) {
            switch (blend) {
                case MixBlend.setup:
                    bone.rotation = bone.data.rotation;
                default:
                    return;
                case MixBlend.first:
                    r1 = bone.rotation;
                    r2 = bone.data.rotation;
            }
        }
        else {
            r1 = blend == MixBlend.setup ? bone.data.rotation : bone.rotation;
            r2 = bone.data.rotation + timeline.getCurveValue(time);
        }
        // Mix between rotations using the direction of the shortest route on the first frame while detecting crosses.
        let total = 0, diff = r2 - r1;
        diff -= (16384 - ((16384.499999999996 - diff / 360) | 0)) * 360;
        if (diff == 0) {
            total = timelinesRotation[i];
        }
        else {
            let lastTotal = 0, lastDiff = 0;
            if (firstFrame) {
                lastTotal = 0;
                lastDiff = diff;
            }
            else {
                lastTotal = timelinesRotation[i]; // Angle and direction of mix, including loops.
                lastDiff = timelinesRotation[i + 1]; // Difference between bones.
            }
            let current = diff > 0, dir = lastTotal >= 0;
            // Detect cross at 0 (not 180).
            if (MathUtils.signum(lastDiff) != MathUtils.signum(diff) && Math.abs(lastDiff) <= 90) {
                // A cross after a 360 rotation is a loop.
                if (Math.abs(lastTotal) > 180)
                    lastTotal += 360 * MathUtils.signum(lastTotal);
                dir = current;
            }
            total = diff + lastTotal - lastTotal % 360; // Store loops as part of lastTotal.
            if (dir != current)
                total += 360 * MathUtils.signum(lastTotal);
            timelinesRotation[i] = total;
        }
        timelinesRotation[i + 1] = diff;
        bone.rotation = r1 + total * alpha;
    }
    queueEvents(entry, animationTime) {
        let animationStart = entry.animationStart, animationEnd = entry.animationEnd;
        let duration = animationEnd - animationStart;
        let trackLastWrapped = entry.trackLast % duration;
        // Queue events before complete.
        let events = this.events;
        let i = 0, n = events.length;
        for (; i < n; i++) {
            let event = events[i];
            if (event.time < trackLastWrapped)
                break;
            if (event.time > animationEnd)
                continue; // Discard events outside animation start/end.
            this.queue.event(entry, event);
        }
        // Queue complete if completed a loop iteration or the animation.
        let complete = false;
        if (entry.loop)
            complete = duration == 0 || trackLastWrapped > entry.trackTime % duration;
        else
            complete = animationTime >= animationEnd && entry.animationLast < animationEnd;
        if (complete)
            this.queue.complete(entry);
        // Queue events after complete.
        for (; i < n; i++) {
            let event = events[i];
            if (event.time < animationStart)
                continue; // Discard events outside animation start/end.
            this.queue.event(entry, event);
        }
    }
    /** Removes all animations from all tracks, leaving skeletons in their current pose.
     *
     * It may be desired to use {@link AnimationState#setEmptyAnimation()} to mix the skeletons back to the setup pose,
     * rather than leaving them in their current pose. */
    clearTracks() {
        let oldDrainDisabled = this.queue.drainDisabled;
        this.queue.drainDisabled = true;
        for (let i = 0, n = this.tracks.length; i < n; i++)
            this.clearTrack(i);
        this.tracks.length = 0;
        this.queue.drainDisabled = oldDrainDisabled;
        this.queue.drain();
    }
    /** Removes all animations from the track, leaving skeletons in their current pose.
     *
     * It may be desired to use {@link AnimationState#setEmptyAnimation()} to mix the skeletons back to the setup pose,
     * rather than leaving them in their current pose. */
    clearTrack(trackIndex) {
        if (trackIndex >= this.tracks.length)
            return;
        let current = this.tracks[trackIndex];
        if (!current)
            return;
        this.queue.end(current);
        this.clearNext(current);
        let entry = current;
        while (true) {
            let from = entry.mixingFrom;
            if (!from)
                break;
            this.queue.end(from);
            entry.mixingFrom = null;
            entry.mixingTo = null;
            entry = from;
        }
        this.tracks[current.trackIndex] = null;
        this.queue.drain();
    }
    setCurrent(index, current, interrupt) {
        let from = this.expandToIndex(index);
        this.tracks[index] = current;
        current.previous = null;
        if (from) {
            if (interrupt)
                this.queue.interrupt(from);
            current.mixingFrom = from;
            from.mixingTo = current;
            current.mixTime = 0;
            // Store the interrupted mix percentage.
            if (from.mixingFrom && from.mixDuration > 0)
                current.interruptAlpha *= Math.min(1, from.mixTime / from.mixDuration);
            from.timelinesRotation.length = 0; // Reset rotation for mixing out, in case entry was mixed in.
        }
        this.queue.start(current);
    }
    /** Sets an animation by name.
      *
      * See {@link #setAnimationWith()}. */
    setAnimation(trackIndex, animationName, loop = false) {
        let animation = this.data.skeletonData.findAnimation(animationName);
        if (!animation)
            throw new Error("Animation not found: " + animationName);
        return this.setAnimationWith(trackIndex, animation, loop);
    }
    /** Sets the current animation for a track, discarding any queued animations. If the formerly current track entry was never
     * applied to a skeleton, it is replaced (not mixed from).
     * @param loop If true, the animation will repeat. If false it will not, instead its last frame is applied if played beyond its
     *           duration. In either case {@link TrackEntry#trackEnd} determines when the track is cleared.
     * @returns A track entry to allow further customization of animation playback. References to the track entry must not be kept
     *         after the {@link AnimationStateListener#dispose()} event occurs. */
    setAnimationWith(trackIndex, animation, loop = false) {
        if (!animation)
            throw new Error("animation cannot be null.");
        let interrupt = true;
        let current = this.expandToIndex(trackIndex);
        if (current) {
            if (current.nextTrackLast == -1) {
                // Don't mix from an entry that was never applied.
                this.tracks[trackIndex] = current.mixingFrom;
                this.queue.interrupt(current);
                this.queue.end(current);
                this.clearNext(current);
                current = current.mixingFrom;
                interrupt = false;
            }
            else
                this.clearNext(current);
        }
        let entry = this.trackEntry(trackIndex, animation, loop, current);
        this.setCurrent(trackIndex, entry, interrupt);
        this.queue.drain();
        return entry;
    }
    /** Queues an animation by name.
     *
     * See {@link #addAnimationWith()}. */
    addAnimation(trackIndex, animationName, loop = false, delay = 0) {
        let animation = this.data.skeletonData.findAnimation(animationName);
        if (!animation)
            throw new Error("Animation not found: " + animationName);
        return this.addAnimationWith(trackIndex, animation, loop, delay);
    }
    /** Adds an animation to be played after the current or last queued animation for a track. If the track is empty, it is
     * equivalent to calling {@link #setAnimationWith()}.
     * @param delay If > 0, sets {@link TrackEntry#delay}. If <= 0, the delay set is the duration of the previous track entry
     *           minus any mix duration (from the {@link AnimationStateData}) plus the specified `delay` (ie the mix
     *           ends at (`delay` = 0) or before (`delay` < 0) the previous track entry duration). If the
     *           previous entry is looping, its next loop completion is used instead of its duration.
     * @returns A track entry to allow further customization of animation playback. References to the track entry must not be kept
     *         after the {@link AnimationStateListener#dispose()} event occurs. */
    addAnimationWith(trackIndex, animation, loop = false, delay = 0) {
        if (!animation)
            throw new Error("animation cannot be null.");
        let last = this.expandToIndex(trackIndex);
        if (last) {
            while (last.next)
                last = last.next;
        }
        let entry = this.trackEntry(trackIndex, animation, loop, last);
        if (!last) {
            this.setCurrent(trackIndex, entry, true);
            this.queue.drain();
        }
        else {
            last.next = entry;
            entry.previous = last;
            if (delay <= 0)
                delay += last.getTrackComplete() - entry.mixDuration;
        }
        entry.delay = delay;
        return entry;
    }
    /** Sets an empty animation for a track, discarding any queued animations, and sets the track entry's
     * {@link TrackEntry#mixduration}. An empty animation has no timelines and serves as a placeholder for mixing in or out.
     *
     * Mixing out is done by setting an empty animation with a mix duration using either {@link #setEmptyAnimation()},
     * {@link #setEmptyAnimations()}, or {@link #addEmptyAnimation()}. Mixing to an empty animation causes
     * the previous animation to be applied less and less over the mix duration. Properties keyed in the previous animation
     * transition to the value from lower tracks or to the setup pose value if no lower tracks key the property. A mix duration of
     * 0 still mixes out over one frame.
     *
     * Mixing in is done by first setting an empty animation, then adding an animation using
     * {@link #addAnimation()} and on the returned track entry, set the
     * {@link TrackEntry#setMixDuration()}. Mixing from an empty animation causes the new animation to be applied more and
     * more over the mix duration. Properties keyed in the new animation transition from the value from lower tracks or from the
     * setup pose value if no lower tracks key the property to the value keyed in the new animation. */
    setEmptyAnimation(trackIndex, mixDuration = 0) {
        let entry = this.setAnimationWith(trackIndex, AnimationState.emptyAnimation(), false);
        entry.mixDuration = mixDuration;
        entry.trackEnd = mixDuration;
        return entry;
    }
    /** Adds an empty animation to be played after the current or last queued animation for a track, and sets the track entry's
     * {@link TrackEntry#mixDuration}. If the track is empty, it is equivalent to calling
     * {@link #setEmptyAnimation()}.
     *
     * See {@link #setEmptyAnimation()}.
     * @param delay If > 0, sets {@link TrackEntry#delay}. If <= 0, the delay set is the duration of the previous track entry
     *           minus any mix duration plus the specified `delay` (ie the mix ends at (`delay` = 0) or
     *           before (`delay` < 0) the previous track entry duration). If the previous entry is looping, its next
     *           loop completion is used instead of its duration.
     * @return A track entry to allow further customization of animation playback. References to the track entry must not be kept
     *         after the {@link AnimationStateListener#dispose()} event occurs. */
    addEmptyAnimation(trackIndex, mixDuration = 0, delay = 0) {
        let entry = this.addAnimationWith(trackIndex, AnimationState.emptyAnimation(), false, delay);
        if (delay <= 0)
            entry.delay += entry.mixDuration - mixDuration;
        entry.mixDuration = mixDuration;
        entry.trackEnd = mixDuration;
        return entry;
    }
    /** Sets an empty animation for every track, discarding any queued animations, and mixes to it over the specified mix
      * duration. */
    setEmptyAnimations(mixDuration = 0) {
        let oldDrainDisabled = this.queue.drainDisabled;
        this.queue.drainDisabled = true;
        for (let i = 0, n = this.tracks.length; i < n; i++) {
            let current = this.tracks[i];
            if (current)
                this.setEmptyAnimation(current.trackIndex, mixDuration);
        }
        this.queue.drainDisabled = oldDrainDisabled;
        this.queue.drain();
    }
    expandToIndex(index) {
        if (index < this.tracks.length)
            return this.tracks[index];
        Utils.ensureArrayCapacity(this.tracks, index + 1, null);
        this.tracks.length = index + 1;
        return null;
    }
    /** @param last May be null. */
    trackEntry(trackIndex, animation, loop, last) {
        let entry = this.trackEntryPool.obtain();
        entry.reset();
        entry.trackIndex = trackIndex;
        entry.animation = animation;
        entry.loop = loop;
        entry.holdPrevious = false;
        entry.reverse = false;
        entry.shortestRotation = false;
        entry.eventThreshold = 0;
        entry.attachmentThreshold = 0;
        entry.drawOrderThreshold = 0;
        entry.animationStart = 0;
        entry.animationEnd = animation.duration;
        entry.animationLast = -1;
        entry.nextAnimationLast = -1;
        entry.delay = 0;
        entry.trackTime = 0;
        entry.trackLast = -1;
        entry.nextTrackLast = -1;
        entry.trackEnd = Number.MAX_VALUE;
        entry.timeScale = 1;
        entry.alpha = 1;
        entry.mixTime = 0;
        entry.mixDuration = !last ? 0 : this.data.getMix(last.animation, animation);
        entry.interruptAlpha = 1;
        entry.totalAlpha = 0;
        entry.mixBlend = MixBlend.replace;
        return entry;
    }
    /** Removes the {@link TrackEntry#getNext() next entry} and all entries after it for the specified entry. */
    clearNext(entry) {
        let next = entry.next;
        while (next) {
            this.queue.dispose(next);
            next = next.next;
        }
        entry.next = null;
    }
    _animationsChanged() {
        this.animationsChanged = false;
        this.propertyIDs.clear();
        let tracks = this.tracks;
        for (let i = 0, n = tracks.length; i < n; i++) {
            let entry = tracks[i];
            if (!entry)
                continue;
            while (entry.mixingFrom)
                entry = entry.mixingFrom;
            do {
                if (!entry.mixingTo || entry.mixBlend != MixBlend.add)
                    this.computeHold(entry);
                entry = entry.mixingTo;
            } while (entry);
        }
    }
    computeHold(entry) {
        let to = entry.mixingTo;
        let timelines = entry.animation.timelines;
        let timelinesCount = entry.animation.timelines.length;
        let timelineMode = entry.timelineMode;
        timelineMode.length = timelinesCount;
        let timelineHoldMix = entry.timelineHoldMix;
        timelineHoldMix.length = 0;
        let propertyIDs = this.propertyIDs;
        if (to && to.holdPrevious) {
            for (let i = 0; i < timelinesCount; i++)
                timelineMode[i] = propertyIDs.addAll(timelines[i].getPropertyIds()) ? HOLD_FIRST : HOLD_SUBSEQUENT;
            return;
        }
        outer: for (let i = 0; i < timelinesCount; i++) {
            let timeline = timelines[i];
            let ids = timeline.getPropertyIds();
            if (!propertyIDs.addAll(ids))
                timelineMode[i] = SUBSEQUENT;
            else if (!to || timeline instanceof AttachmentTimeline || timeline instanceof DrawOrderTimeline
                || timeline instanceof EventTimeline || !to.animation.hasTimeline(ids)) {
                timelineMode[i] = FIRST;
            }
            else {
                for (let next = to.mixingTo; next; next = next.mixingTo) {
                    if (next.animation.hasTimeline(ids))
                        continue;
                    if (entry.mixDuration > 0) {
                        timelineMode[i] = HOLD_MIX;
                        timelineHoldMix[i] = next;
                        continue outer;
                    }
                    break;
                }
                timelineMode[i] = HOLD_FIRST;
            }
        }
    }
    /** Returns the track entry for the animation currently playing on the track, or null if no animation is currently playing. */
    getCurrent(trackIndex) {
        if (trackIndex >= this.tracks.length)
            return null;
        return this.tracks[trackIndex];
    }
    /** Adds a listener to receive events for all track entries. */
    addListener(listener) {
        if (!listener)
            throw new Error("listener cannot be null.");
        this.listeners.push(listener);
    }
    /** Removes the listener added with {@link #addListener()}. */
    removeListener(listener) {
        let index = this.listeners.indexOf(listener);
        if (index >= 0)
            this.listeners.splice(index, 1);
    }
    /** Removes all listeners added with {@link #addListener()}. */
    clearListeners() {
        this.listeners.length = 0;
    }
    /** Discards all listener notifications that have not yet been delivered. This can be useful to call from an
     * {@link AnimationStateListener} when it is known that further notifications that may have been already queued for delivery
     * are not wanted because new animations are being set. */
    clearListenerNotifications() {
        this.queue.clear();
    }
}
/** Stores settings and other state for the playback of an animation on an {@link AnimationState} track.
 *
 * References to a track entry must not be kept after the {@link AnimationStateListener#dispose()} event occurs. */
export class TrackEntry {
    /** The animation to apply for this track entry. */
    animation = null;
    previous = null;
    /** The animation queued to start after this animation, or null. `next` makes up a linked list. */
    next = null;
    /** The track entry for the previous animation when mixing from the previous animation to this animation, or null if no
     * mixing is currently occuring. When mixing from multiple animations, `mixingFrom` makes up a linked list. */
    mixingFrom = null;
    /** The track entry for the next animation when mixing from this animation to the next animation, or null if no mixing is
     * currently occuring. When mixing to multiple animations, `mixingTo` makes up a linked list. */
    mixingTo = null;
    /** The listener for events generated by this track entry, or null.
     *
     * A track entry returned from {@link AnimationState#setAnimation()} is already the current animation
     * for the track, so the track entry listener {@link AnimationStateListener#start()} will not be called. */
    listener = null;
    /** The index of the track where this track entry is either current or queued.
     *
     * See {@link AnimationState#getCurrent()}. */
    trackIndex = 0;
    /** If true, the animation will repeat. If false it will not, instead its last frame is applied if played beyond its
     * duration. */
    loop = false;
    /** If true, when mixing from the previous animation to this animation, the previous animation is applied as normal instead
     * of being mixed out.
     *
     * When mixing between animations that key the same property, if a lower track also keys that property then the value will
     * briefly dip toward the lower track value during the mix. This happens because the first animation mixes from 100% to 0%
     * while the second animation mixes from 0% to 100%. Setting `holdPrevious` to true applies the first animation
     * at 100% during the mix so the lower track value is overwritten. Such dipping does not occur on the lowest track which
     * keys the property, only when a higher track also keys the property.
     *
     * Snapping will occur if `holdPrevious` is true and this animation does not key all the same properties as the
     * previous animation. */
    holdPrevious = false;
    reverse = false;
    shortestRotation = false;
    /** When the mix percentage ({@link #mixTime} / {@link #mixDuration}) is less than the
     * `eventThreshold`, event timelines are applied while this animation is being mixed out. Defaults to 0, so event
     * timelines are not applied while this animation is being mixed out. */
    eventThreshold = 0;
    /** When the mix percentage ({@link #mixtime} / {@link #mixDuration}) is less than the
     * `attachmentThreshold`, attachment timelines are applied while this animation is being mixed out. Defaults to
     * 0, so attachment timelines are not applied while this animation is being mixed out. */
    attachmentThreshold = 0;
    /** When the mix percentage ({@link #mixTime} / {@link #mixDuration}) is less than the
     * `drawOrderThreshold`, draw order timelines are applied while this animation is being mixed out. Defaults to 0,
     * so draw order timelines are not applied while this animation is being mixed out. */
    drawOrderThreshold = 0;
    /** Seconds when this animation starts, both initially and after looping. Defaults to 0.
     *
     * When changing the `animationStart` time, it often makes sense to set {@link #animationLast} to the same
     * value to prevent timeline keys before the start time from triggering. */
    animationStart = 0;
    /** Seconds for the last frame of this animation. Non-looping animations won't play past this time. Looping animations will
     * loop back to {@link #animationStart} at this time. Defaults to the animation {@link Animation#duration}. */
    animationEnd = 0;
    /** The time in seconds this animation was last applied. Some timelines use this for one-time triggers. Eg, when this
     * animation is applied, event timelines will fire all events between the `animationLast` time (exclusive) and
     * `animationTime` (inclusive). Defaults to -1 to ensure triggers on frame 0 happen the first time this animation
     * is applied. */
    animationLast = 0;
    nextAnimationLast = 0;
    /** Seconds to postpone playing the animation. When this track entry is the current track entry, `delay`
     * postpones incrementing the {@link #trackTime}. When this track entry is queued, `delay` is the time from
     * the start of the previous animation to when this track entry will become the current track entry (ie when the previous
     * track entry {@link TrackEntry#trackTime} >= this track entry's `delay`).
     *
     * {@link #timeScale} affects the delay. */
    delay = 0;
    /** Current time in seconds this track entry has been the current track entry. The track time determines
     * {@link #animationTime}. The track time can be set to start the animation at a time other than 0, without affecting
     * looping. */
    trackTime = 0;
    trackLast = 0;
    nextTrackLast = 0;
    /** The track time in seconds when this animation will be removed from the track. Defaults to the highest possible float
     * value, meaning the animation will be applied until a new animation is set or the track is cleared. If the track end time
     * is reached, no other animations are queued for playback, and mixing from any previous animations is complete, then the
     * properties keyed by the animation are set to the setup pose and the track is cleared.
     *
     * It may be desired to use {@link AnimationState#addEmptyAnimation()} rather than have the animation
     * abruptly cease being applied. */
    trackEnd = 0;
    /** Multiplier for the delta time when this track entry is updated, causing time for this animation to pass slower or
     * faster. Defaults to 1.
     *
     * {@link #mixTime} is not affected by track entry time scale, so {@link #mixDuration} may need to be adjusted to
     * match the animation speed.
     *
     * When using {@link AnimationState#addAnimation()} with a `delay` <= 0, note the
     * {@link #delay} is set using the mix duration from the {@link AnimationStateData}, assuming time scale to be 1. If
     * the time scale is not 1, the delay may need to be adjusted.
     *
     * See AnimationState {@link AnimationState#timeScale} for affecting all animations. */
    timeScale = 0;
    /** Values < 1 mix this animation with the skeleton's current pose (usually the pose resulting from lower tracks). Defaults
     * to 1, which overwrites the skeleton's current pose with this animation.
     *
     * Typically track 0 is used to completely pose the skeleton, then alpha is used on higher tracks. It doesn't make sense to
     * use alpha on track 0 if the skeleton pose is from the last frame render. */
    alpha = 0;
    /** Seconds from 0 to the {@link #getMixDuration()} when mixing from the previous animation to this animation. May be
     * slightly more than `mixDuration` when the mix is complete. */
    mixTime = 0;
    /** Seconds for mixing from the previous animation to this animation. Defaults to the value provided by AnimationStateData
     * {@link AnimationStateData#getMix()} based on the animation before this animation (if any).
     *
     * A mix duration of 0 still mixes out over one frame to provide the track entry being mixed out a chance to revert the
     * properties it was animating.
     *
     * The `mixDuration` can be set manually rather than use the value from
     * {@link AnimationStateData#getMix()}. In that case, the `mixDuration` can be set for a new
     * track entry only before {@link AnimationState#update(float)} is first called.
     *
     * When using {@link AnimationState#addAnimation()} with a `delay` <= 0, note the
     * {@link #delay} is set using the mix duration from the {@link AnimationStateData}, not a mix duration set
     * afterward. */
    mixDuration = 0;
    interruptAlpha = 0;
    totalAlpha = 0;
    /** Controls how properties keyed in the animation are mixed with lower tracks. Defaults to {@link MixBlend#replace}, which
     * replaces the values from the lower tracks with the animation values. {@link MixBlend#add} adds the animation values to
     * the values from the lower tracks.
     *
     * The `mixBlend` can be set for a new track entry only before {@link AnimationState#apply()} is first
     * called. */
    mixBlend = MixBlend.replace;
    timelineMode = new Array();
    timelineHoldMix = new Array();
    timelinesRotation = new Array();
    reset() {
        this.next = null;
        this.previous = null;
        this.mixingFrom = null;
        this.mixingTo = null;
        this.animation = null;
        this.listener = null;
        this.timelineMode.length = 0;
        this.timelineHoldMix.length = 0;
        this.timelinesRotation.length = 0;
    }
    /** Uses {@link #trackTime} to compute the `animationTime`, which is between {@link #animationStart}
     * and {@link #animationEnd}. When the `trackTime` is 0, the `animationTime` is equal to the
     * `animationStart` time. */
    getAnimationTime() {
        if (this.loop) {
            let duration = this.animationEnd - this.animationStart;
            if (duration == 0)
                return this.animationStart;
            return (this.trackTime % duration) + this.animationStart;
        }
        return Math.min(this.trackTime + this.animationStart, this.animationEnd);
    }
    setAnimationLast(animationLast) {
        this.animationLast = animationLast;
        this.nextAnimationLast = animationLast;
    }
    /** Returns true if at least one loop has been completed.
     *
     * See {@link AnimationStateListener#complete()}. */
    isComplete() {
        return this.trackTime >= this.animationEnd - this.animationStart;
    }
    /** Resets the rotation directions for mixing this entry's rotate timelines. This can be useful to avoid bones rotating the
     * long way around when using {@link #alpha} and starting animations on other tracks.
     *
     * Mixing with {@link MixBlend#replace} involves finding a rotation between two others, which has two possible solutions:
     * the short way or the long way around. The two rotations likely change over time, so which direction is the short or long
     * way also changes. If the short way was always chosen, bones would flip to the other side when that direction became the
     * long way. TrackEntry chooses the short way the first time it is applied and remembers that direction. */
    resetRotationDirections() {
        this.timelinesRotation.length = 0;
    }
    getTrackComplete() {
        let duration = this.animationEnd - this.animationStart;
        if (duration != 0) {
            if (this.loop)
                return duration * (1 + ((this.trackTime / duration) | 0)); // Completion of next loop.
            if (this.trackTime < duration)
                return duration; // Before duration.
        }
        return this.trackTime; // Next update.
    }
}
export class EventQueue {
    objects = [];
    drainDisabled = false;
    animState;
    constructor(animState) {
        this.animState = animState;
    }
    start(entry) {
        this.objects.push(EventType.start);
        this.objects.push(entry);
        this.animState.animationsChanged = true;
    }
    interrupt(entry) {
        this.objects.push(EventType.interrupt);
        this.objects.push(entry);
    }
    end(entry) {
        this.objects.push(EventType.end);
        this.objects.push(entry);
        this.animState.animationsChanged = true;
    }
    dispose(entry) {
        this.objects.push(EventType.dispose);
        this.objects.push(entry);
    }
    complete(entry) {
        this.objects.push(EventType.complete);
        this.objects.push(entry);
    }
    event(entry, event) {
        this.objects.push(EventType.event);
        this.objects.push(entry);
        this.objects.push(event);
    }
    drain() {
        if (this.drainDisabled)
            return;
        this.drainDisabled = true;
        let objects = this.objects;
        let listeners = this.animState.listeners;
        for (let i = 0; i < objects.length; i += 2) {
            let type = objects[i];
            let entry = objects[i + 1];
            switch (type) {
                case EventType.start:
                    if (entry.listener && entry.listener.start)
                        entry.listener.start(entry);
                    for (let ii = 0; ii < listeners.length; ii++) {
                        let listener = listeners[ii];
                        if (listener.start)
                            listener.start(entry);
                    }
                    break;
                case EventType.interrupt:
                    if (entry.listener && entry.listener.interrupt)
                        entry.listener.interrupt(entry);
                    for (let ii = 0; ii < listeners.length; ii++) {
                        let listener = listeners[ii];
                        if (listener.interrupt)
                            listener.interrupt(entry);
                    }
                    break;
                case EventType.end:
                    if (entry.listener && entry.listener.end)
                        entry.listener.end(entry);
                    for (let ii = 0; ii < listeners.length; ii++) {
                        let listener = listeners[ii];
                        if (listener.end)
                            listener.end(entry);
                    }
                // Fall through.
                case EventType.dispose:
                    if (entry.listener && entry.listener.dispose)
                        entry.listener.dispose(entry);
                    for (let ii = 0; ii < listeners.length; ii++) {
                        let listener = listeners[ii];
                        if (listener.dispose)
                            listener.dispose(entry);
                    }
                    this.animState.trackEntryPool.free(entry);
                    break;
                case EventType.complete:
                    if (entry.listener && entry.listener.complete)
                        entry.listener.complete(entry);
                    for (let ii = 0; ii < listeners.length; ii++) {
                        let listener = listeners[ii];
                        if (listener.complete)
                            listener.complete(entry);
                    }
                    break;
                case EventType.event:
                    let event = objects[i++ + 2];
                    if (entry.listener && entry.listener.event)
                        entry.listener.event(entry, event);
                    for (let ii = 0; ii < listeners.length; ii++) {
                        let listener = listeners[ii];
                        if (listener.event)
                            listener.event(entry, event);
                    }
                    break;
            }
        }
        this.clear();
        this.drainDisabled = false;
    }
    clear() {
        this.objects.length = 0;
    }
}
export var EventType;
(function (EventType) {
    EventType[EventType["start"] = 0] = "start";
    EventType[EventType["interrupt"] = 1] = "interrupt";
    EventType[EventType["end"] = 2] = "end";
    EventType[EventType["dispose"] = 3] = "dispose";
    EventType[EventType["complete"] = 4] = "complete";
    EventType[EventType["event"] = 5] = "event";
})(EventType || (EventType = {}));
export class AnimationStateAdapter {
    start(entry) {
    }
    interrupt(entry) {
    }
    end(entry) {
    }
    dispose(entry) {
    }
    complete(entry) {
    }
    event(entry, event) {
    }
}
/** 1. A previously applied timeline has set this property.
 *
 * Result: Mix from the current pose to the timeline pose. */
export const SUBSEQUENT = 0;
/** 1. This is the first timeline to set this property.
 * 2. The next track entry applied after this one does not have a timeline to set this property.
 *
 * Result: Mix from the setup pose to the timeline pose. */
export const FIRST = 1;
/** 1) A previously applied timeline has set this property.<br>
 * 2) The next track entry to be applied does have a timeline to set this property.<br>
 * 3) The next track entry after that one does not have a timeline to set this property.<br>
 * Result: Mix from the current pose to the timeline pose, but do not mix out. This avoids "dipping" when crossfading
 * animations that key the same property. A subsequent timeline will set this property using a mix. */
export const HOLD_SUBSEQUENT = 2;
/** 1) This is the first timeline to set this property.<br>
 * 2) The next track entry to be applied does have a timeline to set this property.<br>
 * 3) The next track entry after that one does not have a timeline to set this property.<br>
 * Result: Mix from the setup pose to the timeline pose, but do not mix out. This avoids "dipping" when crossfading animations
 * that key the same property. A subsequent timeline will set this property using a mix. */
export const HOLD_FIRST = 3;
/** 1. This is the first timeline to set this property.
 * 2. The next track entry to be applied does have a timeline to set this property.
 * 3. The next track entry after that one does have a timeline to set this property.
 * 4. timelineHoldMix stores the first subsequent track entry that does not have a timeline to set this property.
 *
 * Result: The same as HOLD except the mix percentage from the timelineHoldMix track entry is used. This handles when more than
 * 2 track entries in a row have a timeline that sets the same property.
 *
 * Eg, A -> B -> C -> D where A, B, and C have a timeline setting same property, but D does not. When A is applied, to avoid
 * "dipping" A is not mixed out, however D (the first entry that doesn't set the property) mixing in is used to mix out A
 * (which affects B and C). Without using D to mix out, A would be applied fully until mixing completes, then snap into
 * place. */
export const HOLD_MIX = 4;
export const SETUP = 1;
export const CURRENT = 2;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQW5pbWF0aW9uU3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvQW5pbWF0aW9uU3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBRS9FLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBSW5KLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFJL0Q7OztvSEFHb0g7QUFDcEgsTUFBTSxPQUFPLGNBQWM7SUFDMUIsTUFBTSxDQUFDLGVBQWUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2pELE1BQU0sQ0FBQyxjQUFjO1FBQzVCLE9BQU8sY0FBYyxDQUFDLGVBQWUsQ0FBQztJQUN2QyxDQUFDO0lBRUQsdURBQXVEO0lBQ3ZELElBQUksQ0FBcUI7SUFFekIseUZBQXlGO0lBQ3pGLE1BQU0sR0FBRyxJQUFJLEtBQUssRUFBcUIsQ0FBQztJQUV4Qzs7O3VGQUdtRjtJQUNuRixTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsWUFBWSxHQUFHLENBQUMsQ0FBQztJQUVqQixNQUFNLEdBQUcsSUFBSSxLQUFLLEVBQVMsQ0FBQztJQUM1QixTQUFTLEdBQUcsSUFBSSxLQUFLLEVBQTBCLENBQUM7SUFDaEQsS0FBSyxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLFdBQVcsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO0lBQzlCLGlCQUFpQixHQUFHLEtBQUssQ0FBQztJQUUxQixjQUFjLEdBQUcsSUFBSSxJQUFJLENBQWEsR0FBRyxFQUFFLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBRTlELFlBQWEsSUFBd0I7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDbEIsQ0FBQztJQUVELGtIQUFrSDtJQUNsSCxNQUFNLENBQUUsS0FBYTtRQUNwQixLQUFLLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUN4QixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDOUMsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxPQUFPO2dCQUFFLFNBQVM7WUFFdkIsT0FBTyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUM7WUFDbEQsT0FBTyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO1lBRTFDLElBQUksWUFBWSxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDO1lBRTdDLElBQUksT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUU7Z0JBQ3RCLE9BQU8sQ0FBQyxLQUFLLElBQUksWUFBWSxDQUFDO2dCQUM5QixJQUFJLE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQztvQkFBRSxTQUFTO2dCQUNoQyxZQUFZLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO2dCQUM5QixPQUFPLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQzthQUNsQjtZQUVELElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDeEIsSUFBSSxJQUFJLEVBQUU7Z0JBQ1QsNkZBQTZGO2dCQUM3RixJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQzlDLElBQUksUUFBUSxJQUFJLENBQUMsRUFBRTtvQkFDbEIsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7b0JBQ2YsSUFBSSxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7b0JBQ3ZHLE9BQU8sQ0FBQyxTQUFTLElBQUksWUFBWSxDQUFDO29CQUNsQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQy9CLE9BQU8sSUFBSSxDQUFDLFVBQVUsRUFBRTt3QkFDdkIsSUFBSSxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUM7d0JBQ3RCLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO3FCQUN2QjtvQkFDRCxTQUFTO2lCQUNUO2FBQ0Q7aUJBQU0sSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO2dCQUN4RSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUNqQixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDeEIsU0FBUzthQUNUO1lBQ0QsSUFBSSxPQUFPLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ2hFLG1EQUFtRDtnQkFDbkQsSUFBSSxJQUFJLEdBQXNCLE9BQU8sQ0FBQyxVQUFVLENBQUM7Z0JBQ2pELE9BQU8sQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO2dCQUMxQixJQUFJLElBQUk7b0JBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQy9CLE9BQU8sSUFBSSxFQUFFO29CQUNaLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNyQixJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztpQkFDdkI7YUFDRDtZQUVELE9BQU8sQ0FBQyxTQUFTLElBQUksWUFBWSxDQUFDO1NBQ2xDO1FBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNwQixDQUFDO0lBRUQsOERBQThEO0lBQzlELGdCQUFnQixDQUFFLEVBQWMsRUFBRSxLQUFhO1FBQzlDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUM7UUFDekIsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPLElBQUksQ0FBQztRQUV2QixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWxELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQzVDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUVwQyxpRkFBaUY7UUFDakYsSUFBSSxFQUFFLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7WUFDbkQsb0hBQW9IO1lBQ3BILElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsSUFBSSxDQUFDLEVBQUU7Z0JBQ2hELEVBQUUsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztnQkFDaEMsSUFBSSxJQUFJLENBQUMsVUFBVTtvQkFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBQ25ELEVBQUUsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDckI7WUFDRCxPQUFPLFFBQVEsQ0FBQztTQUNoQjtRQUVELElBQUksQ0FBQyxTQUFTLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDekMsRUFBRSxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUM7UUFDcEIsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBRUQ7O3VEQUVtRDtJQUNuRCxLQUFLLENBQUUsUUFBa0I7UUFDeEIsSUFBSSxDQUFDLFFBQVE7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDM0QsSUFBSSxJQUFJLENBQUMsaUJBQWlCO1lBQUUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFFdEQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUN6QixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3pCLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztRQUVwQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzlDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQztnQkFBRSxTQUFTO1lBQzVDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDZixJQUFJLEtBQUssR0FBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1lBRWpFLG1DQUFtQztZQUNuQyxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQ3hCLElBQUksT0FBTyxDQUFDLFVBQVU7Z0JBQ3JCLEdBQUcsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7aUJBQ2xELElBQUksT0FBTyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUk7Z0JBQzlELEdBQUcsR0FBRyxDQUFDLENBQUM7WUFFVCx1QkFBdUI7WUFDdkIsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsRUFBRSxhQUFhLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEVBQUUsU0FBUyxHQUFHLGFBQWEsQ0FBQztZQUNqSCxJQUFJLFdBQVcsR0FBbUIsTUFBTSxDQUFDO1lBQ3pDLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTtnQkFDcEIsU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFVLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQztnQkFDcEQsV0FBVyxHQUFHLElBQUksQ0FBQzthQUNuQjtZQUNELElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFVLENBQUMsU0FBUyxDQUFDO1lBQzdDLElBQUksYUFBYSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7WUFDckMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFO2dCQUNsRCxLQUFLLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsYUFBYSxFQUFFLEVBQUUsRUFBRSxFQUFFO29CQUMxQyx5RkFBeUY7b0JBQ3pGLDRGQUE0RjtvQkFDNUYsb0RBQW9EO29CQUNwRCxLQUFLLENBQUMscUJBQXFCLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUN4QyxJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzdCLElBQUksUUFBUSxZQUFZLGtCQUFrQjt3QkFDekMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQzs7d0JBRXpFLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUNqRzthQUNEO2lCQUFNO2dCQUNOLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUM7Z0JBRXhDLElBQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDO2dCQUNoRCxJQUFJLFVBQVUsR0FBRyxDQUFDLGdCQUFnQixJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLElBQUksYUFBYSxJQUFJLENBQUMsQ0FBQztnQkFDN0YsSUFBSSxVQUFVO29CQUFFLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsYUFBYSxJQUFJLENBQUMsQ0FBQztnQkFFdEUsS0FBSyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLGFBQWEsRUFBRSxFQUFFLEVBQUUsRUFBRTtvQkFDMUMsSUFBSSxRQUFRLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUM3QixJQUFJLGFBQWEsR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7b0JBQzVFLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxRQUFRLFlBQVksY0FBYyxFQUFFO3dCQUM1RCxJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLGFBQWEsRUFBRSxPQUFPLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztxQkFDNUg7eUJBQU0sSUFBSSxRQUFRLFlBQVksa0JBQWtCLEVBQUU7d0JBQ2xELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7cUJBQ3pFO3lCQUFNO3dCQUNOLDZIQUE2SDt3QkFDN0gsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDeEMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLGFBQWEsRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7cUJBQ3hHO2lCQUNEO2FBQ0Q7WUFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztZQUN6QyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNsQixPQUFPLENBQUMsaUJBQWlCLEdBQUcsYUFBYSxDQUFDO1lBQzFDLE9BQU8sQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztTQUMxQztRQUVELHlIQUF5SDtRQUN6SCw0SEFBNEg7UUFDNUgscUNBQXFDO1FBQ3JDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzNDLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7UUFDM0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDdEQsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLElBQUksSUFBSSxDQUFDLGVBQWUsSUFBSSxVQUFVLEVBQUU7Z0JBQ3ZDLElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDO2dCQUM5QyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQzthQUNyRztTQUNEO1FBQ0QsSUFBSSxDQUFDLFlBQVksSUFBSSxDQUFDLENBQUMsQ0FBQyxxRkFBcUY7UUFFN0csSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNuQixPQUFPLE9BQU8sQ0FBQztJQUNoQixDQUFDO0lBRUQsZUFBZSxDQUFFLEVBQWMsRUFBRSxRQUFrQixFQUFFLEtBQWU7UUFDbkUsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLFVBQVcsQ0FBQztRQUMxQixJQUFJLElBQUksQ0FBQyxVQUFVO1lBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWpFLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNaLElBQUksRUFBRSxDQUFDLFdBQVcsSUFBSSxDQUFDLEVBQUUsRUFBRSwrQ0FBK0M7WUFDekUsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNSLElBQUksS0FBSyxJQUFJLFFBQVEsQ0FBQyxLQUFLO2dCQUFFLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO1NBQ3BEO2FBQU07WUFDTixHQUFHLEdBQUcsRUFBRSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDO1lBQ2xDLElBQUksR0FBRyxHQUFHLENBQUM7Z0JBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNyQixJQUFJLEtBQUssSUFBSSxRQUFRLENBQUMsS0FBSztnQkFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztTQUNuRDtRQUVELElBQUksV0FBVyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsU0FBUyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUM7UUFDNUYsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVUsQ0FBQyxTQUFTLENBQUM7UUFDMUMsSUFBSSxhQUFhLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztRQUNyQyxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxjQUFjLEVBQUUsUUFBUSxHQUFHLFNBQVMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNqRixJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLGFBQWEsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxTQUFTLEdBQUcsYUFBYSxDQUFDO1FBQzNHLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLElBQUksQ0FBQyxPQUFPO1lBQ2YsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFVLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQzthQUM3QyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsY0FBYztZQUNqQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUV0QixJQUFJLEtBQUssSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQzFCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLEVBQUUsQ0FBQyxFQUFFO2dCQUNyQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN0RzthQUFNO1lBQ04sSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUNyQyxJQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1lBRTNDLElBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1lBQzdDLElBQUksVUFBVSxHQUFHLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sSUFBSSxhQUFhLElBQUksQ0FBQyxDQUFDO1lBQzFGLElBQUksVUFBVTtnQkFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLGFBQWEsSUFBSSxDQUFDLENBQUM7WUFFbkUsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDcEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDdkMsSUFBSSxRQUFRLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDO2dCQUNwQyxJQUFJLGFBQXVCLENBQUM7Z0JBQzVCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztnQkFDZCxRQUFRLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDeEIsS0FBSyxVQUFVO3dCQUNkLElBQUksQ0FBQyxTQUFTLElBQUksUUFBUSxZQUFZLGlCQUFpQjs0QkFBRSxTQUFTO3dCQUNsRSxhQUFhLEdBQUcsS0FBSyxDQUFDO3dCQUN0QixLQUFLLEdBQUcsUUFBUSxDQUFDO3dCQUNqQixNQUFNO29CQUNQLEtBQUssS0FBSzt3QkFDVCxhQUFhLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQzt3QkFDL0IsS0FBSyxHQUFHLFFBQVEsQ0FBQzt3QkFDakIsTUFBTTtvQkFDUCxLQUFLLGVBQWU7d0JBQ25CLGFBQWEsR0FBRyxLQUFLLENBQUM7d0JBQ3RCLEtBQUssR0FBRyxTQUFTLENBQUM7d0JBQ2xCLE1BQU07b0JBQ1AsS0FBSyxVQUFVO3dCQUNkLGFBQWEsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO3dCQUMvQixLQUFLLEdBQUcsU0FBUyxDQUFDO3dCQUNsQixNQUFNO29CQUNQO3dCQUNDLGFBQWEsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO3dCQUMvQixJQUFJLE9BQU8sR0FBRyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2pDLEtBQUssR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO3dCQUMzRSxNQUFNO2lCQUNQO2dCQUNELElBQUksQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDO2dCQUV6QixJQUFJLENBQUMsZ0JBQWdCLElBQUksUUFBUSxZQUFZLGNBQWM7b0JBQzFELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO3FCQUN0SCxJQUFJLFFBQVEsWUFBWSxrQkFBa0I7b0JBQzlDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQUM7cUJBQ3BGO29CQUNKLDZIQUE2SDtvQkFDN0gsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDMUMsSUFBSSxTQUFTLElBQUksUUFBUSxZQUFZLGlCQUFpQixJQUFJLGFBQWEsSUFBSSxRQUFRLENBQUMsS0FBSzt3QkFDeEYsU0FBUyxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUM7b0JBQ2hDLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7aUJBQzVGO2FBQ0Q7U0FDRDtRQUVELElBQUksRUFBRSxDQUFDLFdBQVcsR0FBRyxDQUFDO1lBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDOUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxhQUFhLENBQUM7UUFDdkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBRXBDLE9BQU8sR0FBRyxDQUFDO0lBQ1osQ0FBQztJQUVELHVCQUF1QixDQUFFLFFBQTRCLEVBQUUsUUFBa0IsRUFBRSxJQUFZLEVBQUUsS0FBZSxFQUFFLFdBQW9CO1FBQzdILElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU07WUFBRSxPQUFPO1FBRTlCLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSw4QkFBOEI7WUFDOUQsSUFBSSxLQUFLLElBQUksUUFBUSxDQUFDLEtBQUssSUFBSSxLQUFLLElBQUksUUFBUSxDQUFDLEtBQUs7Z0JBQ3JELElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUMzRTs7WUFDQSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUVwSCxtSEFBbUg7UUFDbkgsSUFBSSxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxZQUFZO1lBQUUsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztJQUNqRyxDQUFDO0lBRUQsYUFBYSxDQUFFLFFBQWtCLEVBQUUsSUFBVSxFQUFFLGNBQTZCLEVBQUUsV0FBb0I7UUFDakcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDckcsSUFBSSxXQUFXO1lBQUUsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQztJQUNyRSxDQUFDO0lBRUQsbUJBQW1CLENBQUUsUUFBd0IsRUFBRSxRQUFrQixFQUFFLElBQVksRUFBRSxLQUFhLEVBQUUsS0FBZSxFQUM5RyxpQkFBZ0MsRUFBRSxDQUFTLEVBQUUsVUFBbUI7UUFFaEUsSUFBSSxVQUFVO1lBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXpDLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtZQUNmLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RFLE9BQU87U0FDUDtRQUVELElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTTtZQUFFLE9BQU87UUFDekIsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUM3QixJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNuQixJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDckIsUUFBUSxLQUFLLEVBQUU7Z0JBQ2QsS0FBSyxRQUFRLENBQUMsS0FBSztvQkFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztnQkFDcEM7b0JBQ0MsT0FBTztnQkFDUixLQUFLLFFBQVEsQ0FBQyxLQUFLO29CQUNsQixFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztvQkFDbkIsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO2FBQ3pCO1NBQ0Q7YUFBTTtZQUNOLEVBQUUsR0FBRyxLQUFLLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDbEUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdkQ7UUFFRCw4R0FBOEc7UUFDOUcsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQzlCLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ2hFLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRTtZQUNkLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUM3QjthQUFNO1lBQ04sSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDaEMsSUFBSSxVQUFVLEVBQUU7Z0JBQ2YsU0FBUyxHQUFHLENBQUMsQ0FBQztnQkFDZCxRQUFRLEdBQUcsSUFBSSxDQUFDO2FBQ2hCO2lCQUFNO2dCQUNOLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLCtDQUErQztnQkFDakYsUUFBUSxHQUFHLGlCQUFpQixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLDRCQUE0QjthQUNqRTtZQUNELElBQUksT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLFNBQVMsSUFBSSxDQUFDLENBQUM7WUFDN0MsK0JBQStCO1lBQy9CLElBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUNyRiwwQ0FBMEM7Z0JBQzFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHO29CQUFFLFNBQVMsSUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDOUUsR0FBRyxHQUFHLE9BQU8sQ0FBQzthQUNkO1lBQ0QsS0FBSyxHQUFHLElBQUksR0FBRyxTQUFTLEdBQUcsU0FBUyxHQUFHLEdBQUcsQ0FBQyxDQUFDLG9DQUFvQztZQUNoRixJQUFJLEdBQUcsSUFBSSxPQUFPO2dCQUFFLEtBQUssSUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMvRCxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7U0FDN0I7UUFDRCxpQkFBaUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDcEMsQ0FBQztJQUVELFdBQVcsQ0FBRSxLQUFpQixFQUFFLGFBQXFCO1FBQ3BELElBQUksY0FBYyxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7UUFDN0UsSUFBSSxRQUFRLEdBQUcsWUFBWSxHQUFHLGNBQWMsQ0FBQztRQUM3QyxJQUFJLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBRWxELGdDQUFnQztRQUNoQyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDbEIsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLElBQUksS0FBSyxDQUFDLElBQUksR0FBRyxnQkFBZ0I7Z0JBQUUsTUFBTTtZQUN6QyxJQUFJLEtBQUssQ0FBQyxJQUFJLEdBQUcsWUFBWTtnQkFBRSxTQUFTLENBQUMsOENBQThDO1lBQ3ZGLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztTQUMvQjtRQUVELGlFQUFpRTtRQUNqRSxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDckIsSUFBSSxLQUFLLENBQUMsSUFBSTtZQUNiLFFBQVEsR0FBRyxRQUFRLElBQUksQ0FBQyxJQUFJLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDOztZQUUxRSxRQUFRLEdBQUcsYUFBYSxJQUFJLFlBQVksSUFBSSxLQUFLLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztRQUNoRixJQUFJLFFBQVE7WUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV6QywrQkFBK0I7UUFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2xCLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixJQUFJLEtBQUssQ0FBQyxJQUFJLEdBQUcsY0FBYztnQkFBRSxTQUFTLENBQUMsOENBQThDO1lBQ3pGLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztTQUMvQjtJQUNGLENBQUM7SUFFRDs7O3lEQUdxRDtJQUNyRCxXQUFXO1FBQ1YsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQztRQUNoRCxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQ2pELElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLGdCQUFnQixDQUFDO1FBQzVDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7eURBR3FEO0lBQ3JELFVBQVUsQ0FBRSxVQUFrQjtRQUM3QixJQUFJLFVBQVUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFBRSxPQUFPO1FBQzdDLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLE9BQU87WUFBRSxPQUFPO1FBRXJCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXhCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFeEIsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDO1FBQ3BCLE9BQU8sSUFBSSxFQUFFO1lBQ1osSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztZQUM1QixJQUFJLENBQUMsSUFBSTtnQkFBRSxNQUFNO1lBQ2pCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JCLEtBQUssQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLEtBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLEtBQUssR0FBRyxJQUFJLENBQUM7U0FDYjtRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUV2QyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxVQUFVLENBQUUsS0FBYSxFQUFFLE9BQW1CLEVBQUUsU0FBa0I7UUFDakUsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQztRQUM3QixPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUV4QixJQUFJLElBQUksRUFBRTtZQUNULElBQUksU0FBUztnQkFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxQyxPQUFPLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUMxQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QixPQUFPLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztZQUVwQix3Q0FBd0M7WUFDeEMsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQztnQkFDMUMsT0FBTyxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUV4RSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLDZEQUE2RDtTQUNoRztRQUVELElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRDs7MkNBRXVDO0lBQ3ZDLFlBQVksQ0FBRSxVQUFrQixFQUFFLGFBQXFCLEVBQUUsT0FBZ0IsS0FBSztRQUM3RSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLFNBQVM7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixHQUFHLGFBQWEsQ0FBQyxDQUFDO1FBQ3pFLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVEOzs7OztrRkFLOEU7SUFDOUUsZ0JBQWdCLENBQUUsVUFBa0IsRUFBRSxTQUFvQixFQUFFLE9BQWdCLEtBQUs7UUFDaEYsSUFBSSxDQUFDLFNBQVM7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDN0QsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDN0MsSUFBSSxPQUFPLEVBQUU7WUFDWixJQUFJLE9BQU8sQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hDLGtEQUFrRDtnQkFDbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO2dCQUM3QyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3hCLE9BQU8sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO2dCQUM3QixTQUFTLEdBQUcsS0FBSyxDQUFDO2FBQ2xCOztnQkFDQSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3pCO1FBQ0QsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNsRSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNuQixPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRDs7MENBRXNDO0lBQ3RDLFlBQVksQ0FBRSxVQUFrQixFQUFFLGFBQXFCLEVBQUUsT0FBZ0IsS0FBSyxFQUFFLFFBQWdCLENBQUM7UUFDaEcsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3BFLElBQUksQ0FBQyxTQUFTO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsR0FBRyxhQUFhLENBQUMsQ0FBQztRQUN6RSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQ7Ozs7Ozs7a0ZBTzhFO0lBQzlFLGdCQUFnQixDQUFFLFVBQWtCLEVBQUUsU0FBb0IsRUFBRSxPQUFnQixLQUFLLEVBQUUsUUFBZ0IsQ0FBQztRQUNuRyxJQUFJLENBQUMsU0FBUztZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUU3RCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzFDLElBQUksSUFBSSxFQUFFO1lBQ1QsT0FBTyxJQUFJLENBQUMsSUFBSTtnQkFDZixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztTQUNsQjtRQUVELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFL0QsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNWLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ25CO2FBQU07WUFDTixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztZQUNsQixLQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUN0QixJQUFJLEtBQUssSUFBSSxDQUFDO2dCQUFFLEtBQUssSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO1NBQ3JFO1FBRUQsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDcEIsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7dUdBYW1HO0lBQ25HLGlCQUFpQixDQUFFLFVBQWtCLEVBQUUsY0FBc0IsQ0FBQztRQUM3RCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxjQUFjLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0RixLQUFLLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUNoQyxLQUFLLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQztRQUM3QixPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRDs7Ozs7Ozs7OztrRkFVOEU7SUFDOUUsaUJBQWlCLENBQUUsVUFBa0IsRUFBRSxjQUFzQixDQUFDLEVBQUUsUUFBZ0IsQ0FBQztRQUNoRixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxjQUFjLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0YsSUFBSSxLQUFLLElBQUksQ0FBQztZQUFFLEtBQUssQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0QsS0FBSyxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDaEMsS0FBSyxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUM7UUFDN0IsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBRUQ7b0JBQ2dCO0lBQ2hCLGtCQUFrQixDQUFFLGNBQXNCLENBQUM7UUFDMUMsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQztRQUNoRCxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDbkQsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixJQUFJLE9BQU87Z0JBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDckU7UUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQztRQUM1QyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxhQUFhLENBQUUsS0FBYTtRQUMzQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFBRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUQsS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELCtCQUErQjtJQUMvQixVQUFVLENBQUUsVUFBa0IsRUFBRSxTQUFvQixFQUFFLElBQWEsRUFBRSxJQUF1QjtRQUMzRixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3pDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNkLEtBQUssQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzlCLEtBQUssQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzVCLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLEtBQUssQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBRTNCLEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3RCLEtBQUssQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7UUFFL0IsS0FBSyxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7UUFDekIsS0FBSyxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQztRQUM5QixLQUFLLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO1FBRTdCLEtBQUssQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLEtBQUssQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUN4QyxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUU3QixLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNoQixLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNwQixLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDekIsS0FBSyxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO1FBQ2xDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBRXBCLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLEtBQUssQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLEtBQUssQ0FBQyxXQUFXLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM3RSxLQUFLLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQztRQUN6QixLQUFLLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztRQUNyQixLQUFLLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUM7UUFDbEMsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBRUQsNEdBQTRHO0lBQzVHLFNBQVMsQ0FBRSxLQUFpQjtRQUMzQixJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQ3RCLE9BQU8sSUFBSSxFQUFFO1lBQ1osSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekIsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7U0FDakI7UUFDRCxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNuQixDQUFDO0lBRUQsa0JBQWtCO1FBQ2pCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFFL0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN6QixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDOUMsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxLQUFLO2dCQUFFLFNBQVM7WUFDckIsT0FBTyxLQUFLLENBQUMsVUFBVTtnQkFDdEIsS0FBSyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7WUFDMUIsR0FBRztnQkFDRixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxHQUFHO29CQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQy9FLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO2FBQ3ZCLFFBQVEsS0FBSyxFQUFFO1NBQ2hCO0lBQ0YsQ0FBQztJQUVELFdBQVcsQ0FBRSxLQUFpQjtRQUM3QixJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQ3hCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFVLENBQUMsU0FBUyxDQUFDO1FBQzNDLElBQUksY0FBYyxHQUFHLEtBQUssQ0FBQyxTQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztRQUN2RCxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO1FBQ3RDLFlBQVksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDO1FBQ3JDLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7UUFDNUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDM0IsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUVuQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsWUFBWSxFQUFFO1lBQzFCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxjQUFjLEVBQUUsQ0FBQyxFQUFFO2dCQUN0QyxZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUM7WUFDcEcsT0FBTztTQUNQO1FBRUQsS0FBSyxFQUNMLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxjQUFjLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDeEMsSUFBSSxRQUFRLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVCLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7Z0JBQzNCLFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUM7aUJBQ3pCLElBQUksQ0FBQyxFQUFFLElBQUksUUFBUSxZQUFZLGtCQUFrQixJQUFJLFFBQVEsWUFBWSxpQkFBaUI7bUJBQzNGLFFBQVEsWUFBWSxhQUFhLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBVSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDekUsWUFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQzthQUN4QjtpQkFBTTtnQkFDTixLQUFLLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxJQUFLLENBQUMsUUFBUSxFQUFFO29CQUN6RCxJQUFJLElBQUksQ0FBQyxTQUFVLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQzt3QkFBRSxTQUFTO29CQUMvQyxJQUFJLEtBQUssQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFO3dCQUMxQixZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO3dCQUMzQixlQUFlLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO3dCQUMxQixTQUFTLEtBQUssQ0FBQztxQkFDZjtvQkFDRCxNQUFNO2lCQUNOO2dCQUNELFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUM7YUFDN0I7U0FDRDtJQUNGLENBQUM7SUFFRCw4SEFBOEg7SUFDOUgsVUFBVSxDQUFFLFVBQWtCO1FBQzdCLElBQUksVUFBVSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTTtZQUFFLE9BQU8sSUFBSSxDQUFDO1FBQ2xELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsK0RBQStEO0lBQy9ELFdBQVcsQ0FBRSxRQUFnQztRQUM1QyxJQUFJLENBQUMsUUFBUTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsOERBQThEO0lBQzlELGNBQWMsQ0FBRSxRQUFnQztRQUMvQyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM3QyxJQUFJLEtBQUssSUFBSSxDQUFDO1lBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRCwrREFBK0Q7SUFDL0QsY0FBYztRQUNiLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQ7OzhEQUUwRDtJQUMxRCwwQkFBMEI7UUFDekIsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNwQixDQUFDOztBQUdGOzttSEFFbUg7QUFDbkgsTUFBTSxPQUFPLFVBQVU7SUFDdEIsbURBQW1EO0lBQ25ELFNBQVMsR0FBcUIsSUFBSSxDQUFDO0lBRW5DLFFBQVEsR0FBc0IsSUFBSSxDQUFDO0lBRW5DLGtHQUFrRztJQUNsRyxJQUFJLEdBQXNCLElBQUksQ0FBQztJQUUvQjtrSEFDOEc7SUFDOUcsVUFBVSxHQUFzQixJQUFJLENBQUM7SUFFckM7b0dBQ2dHO0lBQ2hHLFFBQVEsR0FBc0IsSUFBSSxDQUFDO0lBRW5DOzs7K0dBRzJHO0lBQzNHLFFBQVEsR0FBa0MsSUFBSSxDQUFDO0lBRS9DOztrREFFOEM7SUFDOUMsVUFBVSxHQUFXLENBQUMsQ0FBQztJQUV2QjttQkFDZTtJQUNmLElBQUksR0FBWSxLQUFLLENBQUM7SUFFdEI7Ozs7Ozs7Ozs7NkJBVXlCO0lBQ3pCLFlBQVksR0FBWSxLQUFLLENBQUM7SUFFOUIsT0FBTyxHQUFZLEtBQUssQ0FBQztJQUV6QixnQkFBZ0IsR0FBWSxLQUFLLENBQUM7SUFFbEM7OzRFQUV3RTtJQUN4RSxjQUFjLEdBQVcsQ0FBQyxDQUFDO0lBRTNCOzs2RkFFeUY7SUFDekYsbUJBQW1CLEdBQVcsQ0FBQyxDQUFDO0lBRWhDOzswRkFFc0Y7SUFDdEYsa0JBQWtCLEdBQVcsQ0FBQyxDQUFDO0lBRS9COzs7K0VBRzJFO0lBQzNFLGNBQWMsR0FBVyxDQUFDLENBQUM7SUFFM0I7a0hBQzhHO0lBQzlHLFlBQVksR0FBVyxDQUFDLENBQUM7SUFHekI7OztxQkFHaUI7SUFDakIsYUFBYSxHQUFXLENBQUMsQ0FBQztJQUUxQixpQkFBaUIsR0FBVyxDQUFDLENBQUM7SUFFOUI7Ozs7OytDQUsyQztJQUMzQyxLQUFLLEdBQVcsQ0FBQyxDQUFDO0lBRWxCOztrQkFFYztJQUNkLFNBQVMsR0FBVyxDQUFDLENBQUM7SUFFdEIsU0FBUyxHQUFXLENBQUMsQ0FBQztJQUFDLGFBQWEsR0FBVyxDQUFDLENBQUM7SUFFakQ7Ozs7Ozt1Q0FNbUM7SUFDbkMsUUFBUSxHQUFXLENBQUMsQ0FBQztJQUVyQjs7Ozs7Ozs7OzsyRkFVdUY7SUFDdkYsU0FBUyxHQUFXLENBQUMsQ0FBQztJQUV0Qjs7OztrRkFJOEU7SUFDOUUsS0FBSyxHQUFXLENBQUMsQ0FBQztJQUVsQjtvRUFDZ0U7SUFDaEUsT0FBTyxHQUFXLENBQUMsQ0FBQztJQUVwQjs7Ozs7Ozs7Ozs7O29CQVlnQjtJQUNoQixXQUFXLEdBQVcsQ0FBQyxDQUFDO0lBQUMsY0FBYyxHQUFXLENBQUMsQ0FBQztJQUFDLFVBQVUsR0FBVyxDQUFDLENBQUM7SUFFNUU7Ozs7O2lCQUthO0lBQ2IsUUFBUSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUM7SUFDNUIsWUFBWSxHQUFHLElBQUksS0FBSyxFQUFVLENBQUM7SUFDbkMsZUFBZSxHQUFHLElBQUksS0FBSyxFQUFjLENBQUM7SUFDMUMsaUJBQWlCLEdBQUcsSUFBSSxLQUFLLEVBQVUsQ0FBQztJQUV4QyxLQUFLO1FBQ0osSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDckIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDckIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDckIsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7O2dDQUU0QjtJQUM1QixnQkFBZ0I7UUFDZixJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDZCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7WUFDdkQsSUFBSSxRQUFRLElBQUksQ0FBQztnQkFBRSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7WUFDOUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztTQUN6RDtRQUNELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFFRCxnQkFBZ0IsQ0FBRSxhQUFxQjtRQUN0QyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUNuQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsYUFBYSxDQUFDO0lBQ3hDLENBQUM7SUFFRDs7d0RBRW9EO0lBQ3BELFVBQVU7UUFDVCxPQUFPLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO0lBQ2xFLENBQUM7SUFFRDs7Ozs7OytHQU0yRztJQUMzRyx1QkFBdUI7UUFDdEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVELGdCQUFnQjtRQUNmLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztRQUN2RCxJQUFJLFFBQVEsSUFBSSxDQUFDLEVBQUU7WUFDbEIsSUFBSSxJQUFJLENBQUMsSUFBSTtnQkFBRSxPQUFPLFFBQVEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsMkJBQTJCO1lBQ3JHLElBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRO2dCQUFFLE9BQU8sUUFBUSxDQUFDLENBQUMsbUJBQW1CO1NBQ25FO1FBQ0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsZUFBZTtJQUN2QyxDQUFDO0NBQ0Q7QUFFRCxNQUFNLE9BQU8sVUFBVTtJQUN0QixPQUFPLEdBQWUsRUFBRSxDQUFDO0lBQ3pCLGFBQWEsR0FBRyxLQUFLLENBQUM7SUFDdEIsU0FBUyxDQUFpQjtJQUUxQixZQUFhLFNBQXlCO1FBQ3JDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQzVCLENBQUM7SUFFRCxLQUFLLENBQUUsS0FBaUI7UUFDdkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0lBQ3pDLENBQUM7SUFFRCxTQUFTLENBQUUsS0FBaUI7UUFDM0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxHQUFHLENBQUUsS0FBaUI7UUFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0lBQ3pDLENBQUM7SUFFRCxPQUFPLENBQUUsS0FBaUI7UUFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxRQUFRLENBQUUsS0FBaUI7UUFDMUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxLQUFLLENBQUUsS0FBaUIsRUFBRSxLQUFZO1FBQ3JDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRUQsS0FBSztRQUNKLElBQUksSUFBSSxDQUFDLGFBQWE7WUFBRSxPQUFPO1FBQy9CLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBRTFCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDM0IsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7UUFFekMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMzQyxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFjLENBQUM7WUFDbkMsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQWUsQ0FBQztZQUN6QyxRQUFRLElBQUksRUFBRTtnQkFDYixLQUFLLFNBQVMsQ0FBQyxLQUFLO29CQUNuQixJQUFJLEtBQUssQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLO3dCQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN4RSxLQUFLLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRTt3QkFDN0MsSUFBSSxRQUFRLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUM3QixJQUFJLFFBQVEsQ0FBQyxLQUFLOzRCQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7cUJBQzFDO29CQUNELE1BQU07Z0JBQ1AsS0FBSyxTQUFTLENBQUMsU0FBUztvQkFDdkIsSUFBSSxLQUFLLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUzt3QkFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDaEYsS0FBSyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUU7d0JBQzdDLElBQUksUUFBUSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDN0IsSUFBSSxRQUFRLENBQUMsU0FBUzs0QkFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO3FCQUNsRDtvQkFDRCxNQUFNO2dCQUNQLEtBQUssU0FBUyxDQUFDLEdBQUc7b0JBQ2pCLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUc7d0JBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3BFLEtBQUssSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFO3dCQUM3QyxJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQzdCLElBQUksUUFBUSxDQUFDLEdBQUc7NEJBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDdEM7Z0JBQ0YsZ0JBQWdCO2dCQUNoQixLQUFLLFNBQVMsQ0FBQyxPQUFPO29CQUNyQixJQUFJLEtBQUssQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPO3dCQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM1RSxLQUFLLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRTt3QkFDN0MsSUFBSSxRQUFRLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUM3QixJQUFJLFFBQVEsQ0FBQyxPQUFPOzRCQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7cUJBQzlDO29CQUNELElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDMUMsTUFBTTtnQkFDUCxLQUFLLFNBQVMsQ0FBQyxRQUFRO29CQUN0QixJQUFJLEtBQUssQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRO3dCQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM5RSxLQUFLLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRTt3QkFDN0MsSUFBSSxRQUFRLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUM3QixJQUFJLFFBQVEsQ0FBQyxRQUFROzRCQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7cUJBQ2hEO29CQUNELE1BQU07Z0JBQ1AsS0FBSyxTQUFTLENBQUMsS0FBSztvQkFDbkIsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBVSxDQUFDO29CQUN0QyxJQUFJLEtBQUssQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLO3dCQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDL0UsS0FBSyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUU7d0JBQzdDLElBQUksUUFBUSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDN0IsSUFBSSxRQUFRLENBQUMsS0FBSzs0QkFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztxQkFDakQ7b0JBQ0QsTUFBTTthQUNQO1NBQ0Q7UUFDRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFYixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztJQUM1QixDQUFDO0lBRUQsS0FBSztRQUNKLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUN6QixDQUFDO0NBQ0Q7QUFFRCxNQUFNLENBQU4sSUFBWSxTQUVYO0FBRkQsV0FBWSxTQUFTO0lBQ3BCLDJDQUFLLENBQUE7SUFBRSxtREFBUyxDQUFBO0lBQUUsdUNBQUcsQ0FBQTtJQUFFLCtDQUFPLENBQUE7SUFBRSxpREFBUSxDQUFBO0lBQUUsMkNBQUssQ0FBQTtBQUNoRCxDQUFDLEVBRlcsU0FBUyxLQUFULFNBQVMsUUFFcEI7QUE2QkQsTUFBTSxPQUFnQixxQkFBcUI7SUFDMUMsS0FBSyxDQUFFLEtBQWlCO0lBQ3hCLENBQUM7SUFFRCxTQUFTLENBQUUsS0FBaUI7SUFDNUIsQ0FBQztJQUVELEdBQUcsQ0FBRSxLQUFpQjtJQUN0QixDQUFDO0lBRUQsT0FBTyxDQUFFLEtBQWlCO0lBQzFCLENBQUM7SUFFRCxRQUFRLENBQUUsS0FBaUI7SUFDM0IsQ0FBQztJQUVELEtBQUssQ0FBRSxLQUFpQixFQUFFLEtBQVk7SUFDdEMsQ0FBQztDQUNEO0FBRUQ7OzZEQUU2RDtBQUM3RCxNQUFNLENBQUMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBQzVCOzs7MkRBRzJEO0FBQzNELE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDdkI7Ozs7c0dBSXNHO0FBQ3RHLE1BQU0sQ0FBQyxNQUFNLGVBQWUsR0FBRyxDQUFDLENBQUM7QUFDakM7Ozs7MkZBSTJGO0FBQzNGLE1BQU0sQ0FBQyxNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUM7QUFDNUI7Ozs7Ozs7Ozs7O1lBV1k7QUFDWixNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBRTFCLE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDdkIsTUFBTSxDQUFDLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyJ9