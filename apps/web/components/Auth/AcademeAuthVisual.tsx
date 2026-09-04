'use client'

import React, { useEffect, useRef } from 'react'

export default function AcademeAuthVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl2')

    if (!canvas || !gl) return

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null

      gl.shaderSource(shader, source)
      gl.compileShader(shader)

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }

      return shader
    }

    const vertexShader = compileShader(
      gl.VERTEX_SHADER,
      `#version 300 es
        in vec2 position;

        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,
    )
    const fragmentShader = compileShader(
      gl.FRAGMENT_SHADER,
      `#version 300 es
        precision highp float;

        out vec4 outputColor;
        uniform vec2 resolution;
        uniform float time;

        void main() {
          vec3 point;
          vec3 wave;
          float stepDepth = 0.0;
          float distanceField = 0.0;
          float radius = 0.0;
          vec4 color = vec4(0.0);

          for (float index = 0.0; index < 72.0; index += 1.0) {
            point = stepDepth * (gl_FragCoord.rgb * 2.0 - resolution.xyy) / resolution.y;
            point.z += 2.0;

            vec2 cell = fract(point.xy * 5.0);
            float edge = smoothstep(0.4, 0.5, length(cell - vec2(0.5)));
            point.xy += (edge - 0.5) * 0.3;

            radius = length(point);
            wave = vec3(
              atan(point.x, point.z),
              atan(point.y, length(point.xz)),
              log(radius)
            ) * 8.0 + time;
            wave.xy += sin(time + wave.z) * vec2(0.6, 0.3);

            distanceField = length(
              cos(wave) + sin(wave.yzx + wave + time - radius)
            ) * radius * 0.025;
            stepDepth += distanceField;

            vec3 palette = mix(
              vec3(0.08, 0.28, 0.62),
              vec3(0.78, 0.48, 0.82),
              0.5 + 0.5 * sin(index * 0.7 + time * 0.25)
            );
            float vignette = 1.0 - pow(
              smoothstep(0.55, 1.45, length(gl_FragCoord.xy / resolution.xy)),
              1.5
            );
            color.rgb += palette * vignette / (distanceField + 0.001);
          }

          vec3 mappedColor = tanh(color.rgb / 3200.0) + vec3(0.015, 0.02, 0.055);
          outputColor = vec4(pow(mappedColor, vec3(2.0)), 1.0);
        }
      `,
    )

    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader)
      if (fragmentShader) gl.deleteShader(fragmentShader)
      return
    }

    const program = gl.createProgram()
    if (!program) {
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      return
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      return
    }

    const positionLocation = gl.getAttribLocation(program, 'position')
    const resolutionLocation = gl.getUniformLocation(program, 'resolution')
    const timeLocation = gl.getUniformLocation(program, 'time')
    const positionBuffer = gl.createBuffer()

    if (!positionBuffer) {
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      return
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )
    gl.useProgram(program)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    let frameId = 0
    let width = 0
    let height = 0
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const render = (timestamp: number) => {
      const bounds = canvas.getBoundingClientRect()
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      const nextWidth = Math.max(1, Math.floor(bounds.width * pixelRatio))
      const nextHeight = Math.max(1, Math.floor(bounds.height * pixelRatio))

      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth
        height = nextHeight
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }

      gl.uniform2f(resolutionLocation, width, height)
      gl.uniform1f(timeLocation, reduceMotion ? 0 : timestamp * 0.001)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      if (!reduceMotion) frameId = requestAnimationFrame(render)
    }

    if (reduceMotion) {
      render(0)
    } else {
      frameId = requestAnimationFrame(render)
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      gl.deleteBuffer(positionBuffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    }
  }, [])

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_35%_35%,#1d4f91_0%,#090d22_48%,#02030a_100%)]"
      data-academe-auth-visual="true"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_58%,rgba(0,0,0,0.58)_100%)]" />
    </div>
  )
}
export function AcademeAuthTitle() {
  return (
    <>
      <h1
        className="academe-auth-shimmer text-6xl font-semibold tracking-tight xl:text-7xl"
        data-academe-auth-title="true"
      >
        Academe
      </h1>
      <style>{`
        .academe-auth-shimmer {
          color: transparent;
          background-image: linear-gradient(
            105deg,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.26) 35%,
            rgba(255, 255, 255, 1) 50%,
            rgba(255, 255, 255, 0.26) 65%,
            rgba(255, 255, 255, 0.18) 100%
          );
          background-position: -220px 0;
          background-repeat: no-repeat;
          background-size: 220px 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 14px 38px rgba(0, 0, 0, 0.58));
          animation: academe-auth-title-shimmer 4.2s linear infinite;
        }

        @keyframes academe-auth-title-shimmer {
          from {
            background-position: -220px 0;
          }
          to {
            background-position: calc(100% + 220px) 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .academe-auth-shimmer {
            animation: none;
            background-position: 50% 0;
          }
        }
      `}</style>
    </>
  )
}
