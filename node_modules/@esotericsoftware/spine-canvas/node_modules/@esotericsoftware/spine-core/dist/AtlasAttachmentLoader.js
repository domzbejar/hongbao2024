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
import { BoundingBoxAttachment } from "./attachments/BoundingBoxAttachment.js";
import { ClippingAttachment } from "./attachments/ClippingAttachment.js";
import { MeshAttachment } from "./attachments/MeshAttachment.js";
import { PathAttachment } from "./attachments/PathAttachment.js";
import { PointAttachment } from "./attachments/PointAttachment.js";
import { RegionAttachment } from "./attachments/RegionAttachment.js";
/** An {@link AttachmentLoader} that configures attachments using texture regions from an {@link TextureAtlas}.
 *
 * See [Loading skeleton data](http://esotericsoftware.com/spine-loading-skeleton-data#JSON-and-binary-data) in the
 * Spine Runtimes Guide. */
export class AtlasAttachmentLoader {
    atlas;
    constructor(atlas) {
        this.atlas = atlas;
    }
    loadSequence(name, basePath, sequence) {
        let regions = sequence.regions;
        for (let i = 0, n = regions.length; i < n; i++) {
            let path = sequence.getPath(basePath, i);
            let region = this.atlas.findRegion(path);
            if (region == null)
                throw new Error("Region not found in atlas: " + path + " (sequence: " + name + ")");
            regions[i] = region;
        }
    }
    newRegionAttachment(skin, name, path, sequence) {
        let attachment = new RegionAttachment(name, path);
        if (sequence != null) {
            this.loadSequence(name, path, sequence);
        }
        else {
            let region = this.atlas.findRegion(path);
            if (!region)
                throw new Error("Region not found in atlas: " + path + " (region attachment: " + name + ")");
            attachment.region = region;
        }
        return attachment;
    }
    newMeshAttachment(skin, name, path, sequence) {
        let attachment = new MeshAttachment(name, path);
        if (sequence != null) {
            this.loadSequence(name, path, sequence);
        }
        else {
            let region = this.atlas.findRegion(path);
            if (!region)
                throw new Error("Region not found in atlas: " + path + " (mesh attachment: " + name + ")");
            attachment.region = region;
        }
        return attachment;
    }
    newBoundingBoxAttachment(skin, name) {
        return new BoundingBoxAttachment(name);
    }
    newPathAttachment(skin, name) {
        return new PathAttachment(name);
    }
    newPointAttachment(skin, name) {
        return new PointAttachment(name);
    }
    newClippingAttachment(skin, name) {
        return new ClippingAttachment(name);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXRsYXNBdHRhY2htZW50TG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0F0bGFzQXR0YWNobWVudExvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytFQTJCK0U7QUFHL0UsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sd0NBQXdDLENBQUM7QUFDL0UsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0scUNBQXFDLENBQUM7QUFDekUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGlDQUFpQyxDQUFDO0FBQ2pFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUNqRSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sa0NBQWtDLENBQUM7QUFDbkUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sbUNBQW1DLENBQUM7QUFLckU7OzsyQkFHMkI7QUFDM0IsTUFBTSxPQUFPLHFCQUFxQjtJQUNqQyxLQUFLLENBQWU7SUFFcEIsWUFBYSxLQUFtQjtRQUMvQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNwQixDQUFDO0lBRUQsWUFBWSxDQUFFLElBQVksRUFBRSxRQUFnQixFQUFFLFFBQWtCO1FBQy9ELElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUM7UUFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMvQyxJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QyxJQUFJLE1BQU0sSUFBSSxJQUFJO2dCQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLEdBQUcsSUFBSSxHQUFHLGNBQWMsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDeEcsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztTQUNwQjtJQUNGLENBQUM7SUFFRCxtQkFBbUIsQ0FBRSxJQUFVLEVBQUUsSUFBWSxFQUFFLElBQVksRUFBRSxRQUFrQjtRQUM5RSxJQUFJLFVBQVUsR0FBRyxJQUFJLGdCQUFnQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNsRCxJQUFJLFFBQVEsSUFBSSxJQUFJLEVBQUU7WUFDckIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3hDO2FBQU07WUFDTixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsTUFBTTtnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixHQUFHLElBQUksR0FBRyx1QkFBdUIsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDMUcsVUFBVSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7U0FDM0I7UUFDRCxPQUFPLFVBQVUsQ0FBQztJQUNuQixDQUFDO0lBRUQsaUJBQWlCLENBQUUsSUFBVSxFQUFFLElBQVksRUFBRSxJQUFZLEVBQUUsUUFBa0I7UUFDNUUsSUFBSSxVQUFVLEdBQUcsSUFBSSxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hELElBQUksUUFBUSxJQUFJLElBQUksRUFBRTtZQUNyQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDeEM7YUFBTTtZQUNOLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxNQUFNO2dCQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLEdBQUcsSUFBSSxHQUFHLHFCQUFxQixHQUFHLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztZQUN4RyxVQUFVLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztTQUMzQjtRQUNELE9BQU8sVUFBVSxDQUFDO0lBQ25CLENBQUM7SUFFRCx3QkFBd0IsQ0FBRSxJQUFVLEVBQUUsSUFBWTtRQUNqRCxPQUFPLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELGlCQUFpQixDQUFFLElBQVUsRUFBRSxJQUFZO1FBQzFDLE9BQU8sSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVELGtCQUFrQixDQUFFLElBQVUsRUFBRSxJQUFZO1FBQzNDLE9BQU8sSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVELHFCQUFxQixDQUFFLElBQVUsRUFBRSxJQUFZO1FBQzlDLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQ0QifQ==