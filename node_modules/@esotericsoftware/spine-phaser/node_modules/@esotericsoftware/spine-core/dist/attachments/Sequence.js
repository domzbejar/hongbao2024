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
import { Utils } from "../Utils.js";
export class Sequence {
    static _nextID = 0;
    id = Sequence.nextID();
    regions;
    start = 0;
    digits = 0;
    /** The index of the region to show for the setup pose. */
    setupIndex = 0;
    constructor(count) {
        this.regions = new Array(count);
    }
    copy() {
        let copy = new Sequence(this.regions.length);
        Utils.arrayCopy(this.regions, 0, copy.regions, 0, this.regions.length);
        copy.start = this.start;
        copy.digits = this.digits;
        copy.setupIndex = this.setupIndex;
        return copy;
    }
    apply(slot, attachment) {
        let index = slot.sequenceIndex;
        if (index == -1)
            index = this.setupIndex;
        if (index >= this.regions.length)
            index = this.regions.length - 1;
        let region = this.regions[index];
        if (attachment.region != region) {
            attachment.region = region;
            attachment.updateRegion();
        }
    }
    getPath(basePath, index) {
        let result = basePath;
        let frame = (this.start + index).toString();
        for (let i = this.digits - frame.length; i > 0; i--)
            result += "0";
        result += frame;
        return result;
    }
    static nextID() {
        return Sequence._nextID++;
    }
}
export var SequenceMode;
(function (SequenceMode) {
    SequenceMode[SequenceMode["hold"] = 0] = "hold";
    SequenceMode[SequenceMode["once"] = 1] = "once";
    SequenceMode[SequenceMode["loop"] = 2] = "loop";
    SequenceMode[SequenceMode["pingpong"] = 3] = "pingpong";
    SequenceMode[SequenceMode["onceReverse"] = 4] = "onceReverse";
    SequenceMode[SequenceMode["loopReverse"] = 5] = "loopReverse";
    SequenceMode[SequenceMode["pingpongReverse"] = 6] = "pingpongReverse";
})(SequenceMode || (SequenceMode = {}));
export const SequenceModeValues = [
    SequenceMode.hold,
    SequenceMode.once,
    SequenceMode.loop,
    SequenceMode.pingpong,
    SequenceMode.onceReverse,
    SequenceMode.loopReverse,
    SequenceMode.pingpongReverse
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VxdWVuY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYXR0YWNobWVudHMvU2VxdWVuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsrRUEyQitFO0FBSy9FLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFHcEMsTUFBTSxPQUFPLFFBQVE7SUFDWixNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztJQUUzQixFQUFFLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3ZCLE9BQU8sQ0FBa0I7SUFDekIsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNWLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDWCwwREFBMEQ7SUFDMUQsVUFBVSxHQUFHLENBQUMsQ0FBQztJQUVmLFlBQWEsS0FBYTtRQUN6QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksS0FBSyxDQUFnQixLQUFLLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRUQsSUFBSTtRQUNILElBQUksSUFBSSxHQUFHLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0MsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDMUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ2xDLE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELEtBQUssQ0FBRSxJQUFVLEVBQUUsVUFBNEI7UUFDOUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMvQixJQUFJLEtBQUssSUFBSSxDQUFDLENBQUM7WUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN6QyxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU07WUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2xFLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakMsSUFBSSxVQUFVLENBQUMsTUFBTSxJQUFJLE1BQU0sRUFBRTtZQUNoQyxVQUFVLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUMzQixVQUFVLENBQUMsWUFBWSxFQUFFLENBQUM7U0FDMUI7SUFDRixDQUFDO0lBRUQsT0FBTyxDQUFFLFFBQWdCLEVBQUUsS0FBYTtRQUN2QyxJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUM7UUFDdEIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzVDLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQ2xELE1BQU0sSUFBSSxHQUFHLENBQUM7UUFDZixNQUFNLElBQUksS0FBSyxDQUFDO1FBQ2hCLE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVPLE1BQU0sQ0FBQyxNQUFNO1FBQ3BCLE9BQU8sUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzNCLENBQUM7O0FBR0YsTUFBTSxDQUFOLElBQVksWUFRWDtBQVJELFdBQVksWUFBWTtJQUN2QiwrQ0FBUSxDQUFBO0lBQ1IsK0NBQVEsQ0FBQTtJQUNSLCtDQUFRLENBQUE7SUFDUix1REFBWSxDQUFBO0lBQ1osNkRBQWUsQ0FBQTtJQUNmLDZEQUFlLENBQUE7SUFDZixxRUFBbUIsQ0FBQTtBQUNwQixDQUFDLEVBUlcsWUFBWSxLQUFaLFlBQVksUUFRdkI7QUFFRCxNQUFNLENBQUMsTUFBTSxrQkFBa0IsR0FBRztJQUNqQyxZQUFZLENBQUMsSUFBSTtJQUNqQixZQUFZLENBQUMsSUFBSTtJQUNqQixZQUFZLENBQUMsSUFBSTtJQUNqQixZQUFZLENBQUMsUUFBUTtJQUNyQixZQUFZLENBQUMsV0FBVztJQUN4QixZQUFZLENBQUMsV0FBVztJQUN4QixZQUFZLENBQUMsZUFBZTtDQUM1QixDQUFDIn0=