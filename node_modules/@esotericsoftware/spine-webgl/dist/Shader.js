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
import { ManagedWebGLRenderingContext } from "./WebGL.js";
export class Shader {
    vertexShader;
    fragmentShader;
    static MVP_MATRIX = "u_projTrans";
    static POSITION = "a_position";
    static COLOR = "a_color";
    static COLOR2 = "a_color2";
    static TEXCOORDS = "a_texCoords";
    static SAMPLER = "u_texture";
    context;
    vs = null;
    vsSource;
    fs = null;
    fsSource;
    program = null;
    tmp2x2 = new Float32Array(2 * 2);
    tmp3x3 = new Float32Array(3 * 3);
    tmp4x4 = new Float32Array(4 * 4);
    getProgram() { return this.program; }
    getVertexShader() { return this.vertexShader; }
    getFragmentShader() { return this.fragmentShader; }
    getVertexShaderSource() { return this.vsSource; }
    getFragmentSource() { return this.fsSource; }
    constructor(context, vertexShader, fragmentShader) {
        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;
        this.vsSource = vertexShader;
        this.fsSource = fragmentShader;
        this.context = context instanceof ManagedWebGLRenderingContext ? context : new ManagedWebGLRenderingContext(context);
        this.context.addRestorable(this);
        this.compile();
    }
    compile() {
        let gl = this.context.gl;
        try {
            this.vs = this.compileShader(gl.VERTEX_SHADER, this.vertexShader);
            if (!this.vs)
                throw new Error("Couldn't compile vertex shader.");
            this.fs = this.compileShader(gl.FRAGMENT_SHADER, this.fragmentShader);
            if (!this.fs)
                throw new Error("Couldn#t compile fragment shader.");
            this.program = this.compileProgram(this.vs, this.fs);
        }
        catch (e) {
            this.dispose();
            throw e;
        }
    }
    compileShader(type, source) {
        let gl = this.context.gl;
        let shader = gl.createShader(type);
        if (!shader)
            throw new Error("Couldn't create shader.");
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            let error = "Couldn't compile shader: " + gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            if (!gl.isContextLost())
                throw new Error(error);
        }
        return shader;
    }
    compileProgram(vs, fs) {
        let gl = this.context.gl;
        let program = gl.createProgram();
        if (!program)
            throw new Error("Couldn't compile program.");
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            let error = "Couldn't compile shader program: " + gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            if (!gl.isContextLost())
                throw new Error(error);
        }
        return program;
    }
    restore() {
        this.compile();
    }
    bind() {
        this.context.gl.useProgram(this.program);
    }
    unbind() {
        this.context.gl.useProgram(null);
    }
    setUniformi(uniform, value) {
        this.context.gl.uniform1i(this.getUniformLocation(uniform), value);
    }
    setUniformf(uniform, value) {
        this.context.gl.uniform1f(this.getUniformLocation(uniform), value);
    }
    setUniform2f(uniform, value, value2) {
        this.context.gl.uniform2f(this.getUniformLocation(uniform), value, value2);
    }
    setUniform3f(uniform, value, value2, value3) {
        this.context.gl.uniform3f(this.getUniformLocation(uniform), value, value2, value3);
    }
    setUniform4f(uniform, value, value2, value3, value4) {
        this.context.gl.uniform4f(this.getUniformLocation(uniform), value, value2, value3, value4);
    }
    setUniform2x2f(uniform, value) {
        let gl = this.context.gl;
        this.tmp2x2.set(value);
        gl.uniformMatrix2fv(this.getUniformLocation(uniform), false, this.tmp2x2);
    }
    setUniform3x3f(uniform, value) {
        let gl = this.context.gl;
        this.tmp3x3.set(value);
        gl.uniformMatrix3fv(this.getUniformLocation(uniform), false, this.tmp3x3);
    }
    setUniform4x4f(uniform, value) {
        let gl = this.context.gl;
        this.tmp4x4.set(value);
        gl.uniformMatrix4fv(this.getUniformLocation(uniform), false, this.tmp4x4);
    }
    getUniformLocation(uniform) {
        let gl = this.context.gl;
        if (!this.program)
            throw new Error("Shader not compiled.");
        let location = gl.getUniformLocation(this.program, uniform);
        if (!location && !gl.isContextLost())
            throw new Error(`Couldn't find location for uniform ${uniform}`);
        return location;
    }
    getAttributeLocation(attribute) {
        let gl = this.context.gl;
        if (!this.program)
            throw new Error("Shader not compiled.");
        let location = gl.getAttribLocation(this.program, attribute);
        if (location == -1 && !gl.isContextLost())
            throw new Error(`Couldn't find location for attribute ${attribute}`);
        return location;
    }
    dispose() {
        this.context.removeRestorable(this);
        let gl = this.context.gl;
        if (this.vs) {
            gl.deleteShader(this.vs);
            this.vs = null;
        }
        if (this.fs) {
            gl.deleteShader(this.fs);
            this.fs = null;
        }
        if (this.program) {
            gl.deleteProgram(this.program);
            this.program = null;
        }
    }
    static newColoredTextured(context) {
        let vs = `
attribute vec4 ${Shader.POSITION};
attribute vec4 ${Shader.COLOR};
attribute vec2 ${Shader.TEXCOORDS};
uniform mat4 ${Shader.MVP_MATRIX};
varying vec4 v_color;
varying vec2 v_texCoords;

void main () {
	v_color = ${Shader.COLOR};
	v_texCoords = ${Shader.TEXCOORDS};
	gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
}
`;
        let fs = `
#ifdef GL_ES
	#define LOWP lowp
	precision mediump float;
#else
	#define LOWP
#endif
varying LOWP vec4 v_color;
varying vec2 v_texCoords;
uniform sampler2D u_texture;

void main () {
	gl_FragColor = v_color * texture2D(u_texture, v_texCoords);
}
`;
        return new Shader(context, vs, fs);
    }
    static newTwoColoredTextured(context) {
        let vs = `
attribute vec4 ${Shader.POSITION};
attribute vec4 ${Shader.COLOR};
attribute vec4 ${Shader.COLOR2};
attribute vec2 ${Shader.TEXCOORDS};
uniform mat4 ${Shader.MVP_MATRIX};
varying vec4 v_light;
varying vec4 v_dark;
varying vec2 v_texCoords;

void main () {
	v_light = ${Shader.COLOR};
	v_dark = ${Shader.COLOR2};
	v_texCoords = ${Shader.TEXCOORDS};
	gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
}
`;
        let fs = `
#ifdef GL_ES
	#define LOWP lowp
	precision mediump float;
#else
	#define LOWP
#endif
varying LOWP vec4 v_light;
varying LOWP vec4 v_dark;
varying vec2 v_texCoords;
uniform sampler2D u_texture;

void main () {
	vec4 texColor = texture2D(u_texture, v_texCoords);
	gl_FragColor.a = texColor.a * v_light.a;
	gl_FragColor.rgb = ((texColor.a - 1.0) * v_dark.a + 1.0 - texColor.rgb) * v_dark.rgb + texColor.rgb * v_light.rgb;
}
`;
        return new Shader(context, vs, fs);
    }
    static newColored(context) {
        let vs = `
attribute vec4 ${Shader.POSITION};
attribute vec4 ${Shader.COLOR};
uniform mat4 ${Shader.MVP_MATRIX};
varying vec4 v_color;

void main () {
	v_color = ${Shader.COLOR};
	gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
}
`;
        let fs = `
#ifdef GL_ES
	#define LOWP lowp
	precision mediump float;
#else
	#define LOWP
#endif
varying LOWP vec4 v_color;

void main () {
	gl_FragColor = v_color;
}
`;
        return new Shader(context, vs, fs);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2hhZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1NoYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OytFQTJCK0U7QUFHL0UsT0FBTyxFQUFFLDRCQUE0QixFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRTFELE1BQU0sT0FBTyxNQUFNO0lBd0JrRTtJQUE4QjtJQXZCM0csTUFBTSxDQUFDLFVBQVUsR0FBRyxhQUFhLENBQUM7SUFDbEMsTUFBTSxDQUFDLFFBQVEsR0FBRyxZQUFZLENBQUM7SUFDL0IsTUFBTSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7SUFDekIsTUFBTSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUM7SUFDM0IsTUFBTSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7SUFDakMsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUM7SUFFNUIsT0FBTyxDQUErQjtJQUN0QyxFQUFFLEdBQXVCLElBQUksQ0FBQztJQUM5QixRQUFRLENBQVM7SUFDakIsRUFBRSxHQUF1QixJQUFJLENBQUM7SUFDOUIsUUFBUSxDQUFTO0lBQ2pCLE9BQU8sR0FBd0IsSUFBSSxDQUFDO0lBQ3BDLE1BQU0sR0FBaUIsSUFBSSxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQy9DLE1BQU0sR0FBaUIsSUFBSSxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQy9DLE1BQU0sR0FBaUIsSUFBSSxZQUFZLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhELFVBQVUsS0FBTSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLGVBQWUsS0FBTSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQ2hELGlCQUFpQixLQUFNLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDcEQscUJB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