// loop hub
class dimension {
    static #all = {}
    constructor(name, data, rule, init) {
        dimension.#all[name] = this
        this.name = name
        this.data = data
        this.update = rule
        this.init = init
        this.targets = new Map()
    }
    has(target) { return this.targets.has(target) }
    set(target, type) { this.targets.set(target, type) }
    get(target) { return this.targets.get(target) }
    register(target, attrs) {
        this.set(target, null)
        return this.init?.(this.data, this.set.bind(this), target, attrs)
    }
    static next() { for (let d of Object.values(dimension.#all)) d.update(d.data, d.set.bind(d), d.get.bind(d), d.targets) }
}

// connective
function same_type(matrix, i, j, type) { return (!((i < 0 || i >= matrix.length || j < 0 || j >= matrix[0].length))) && (matrix[i][j]?.type == type) }
function connective(matrix, row, visited, right) {
    visited[row][0] = true

    let type = matrix[row][0].type
    let connected = false
    let set = [matrix[row][0]]
    let queue = [[row, 0]]
    let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]

    while (queue.length > 0) {
        let [i, j] = queue.shift()
        for (let [di, dj] of directions) {
            let ni = i + di
            let nj = j + dj
            if (same_type(matrix, ni, nj, type) && !visited[ni][nj]) {
                visited[ni][nj] = true
                queue.push([ni, nj])
                set.push(matrix[ni][nj])
                if (nj == right) connected = true
            }
        }
    }
    return connected ? set : null
}

// flow down
function flowsand(data, set, get, targets) {
    for (let i = 1; i < data.length; i++)
        for (let j = 0; j < data[i].length; j++) {
            if (data[i][j] === null) {
                continue
            }
            if (data[i - 1][j] === null) {
                set(data[i][j], { y: i - 1, x: j })
                data[i - 1][j] = data[i][j]
                data[i][j] = null
            } else if ((j > 0) && (data[i - 1][j - 1] === null)) {
                set(data[i][j], { y: i - 1, x: j - 1 })
                data[i - 1][j - 1] = data[i][j]
                data[i][j] = null
            } else if ((j < data.length - 1) && (data[i][j + 1] === null) && (data[i - 1][j + 1] === null)) {
                set(data[i][j], { y: i - 1, x: j + 1 })
                data[i - 1][j + 1] = data[i][j]
                data[i][j] = null
            }
        }

    let rows = data.length
    let cols = data[0].length
    let visited = Array.from({ length: rows }, () => Array(cols).fill(false))
    for (let i = 0; i < rows; i++) {
        if (!visited[i][0] && data[i][0] != null) {
            let set = connective(data, i, visited, cols - 1)
            if (set) for (let b of set) {
                let { x, y } = get(b)
                targets.delete(b)
                data[y][x] = null
            }
        }
    }
}

// check position
let controling = []
let checkControl = []
let checkLeft = []
let checkRight = []

function checkPosition(data, set, target, { x, y }) {
    if (data[y][x] == null) {
        data[y][x] = target
        set(target, { x, y })
        return true
    }
    return false
}

function controlable() {
    return checkControl.length && checkControl.every(c => {
        if (!position.has(c)) return false
        let { x, y } = position.get(c)
        return (y > 0) && (position.data[y - 1][x] == null)
    })
}

function leftable(speed) {
    return checkLeft.length && checkLeft.every(c => {
        if (!position.has(c)) return false
        let { x, y } = position.get(c)
        return (x >= speed) && (position.data[y][x - speed] == null)
    })
}

function rightable(width, speed) {
    return checkRight.length && checkRight.every(c => {
        if (!position.has(c)) return false
        let { x, y } = position.get(c)
        return (x < width - speed) && (position.data[y][x + speed] == null)
    })
}

function addBlock(Y, X) {
    let color = (Math.random() * level + 1) | 0
    let b = bests[(Math.random() * bests.length) | 0].map(row => row.map(t => t && ({ type: color })))

    for (let i = 0; i < b.length; i++) {
        let width = b[i].length
        for (let j = 0; j < width; j++) {
            if (b[i][j].type > 0) {
                if (position.register(b[i][j], { y: Y - i - 1, x: X - width / 2 + j }))
                    controling.push(b[i][j])
                else return false
            }
        }
    }

    for (let i = b.length - 1; i < b.length; i++)
        for (let j = 0; j < b[i].length; j++)
            if (b[i][j].type > 0) checkControl.push(b[i][j])
    for (let i = 0; i < b.length; i++)
        if (b[i][0].type > 0) checkLeft.push(b[i][0])
    for (let i = 0; i < b.length; i++) {
        let j = b[i].length - 1
        if (b[i][j].type > 0) checkRight.push(b[i][j])
    }
    return true
}

// load data
function loadData(data, xsize, ysize) {
    const rows = data.length
    const cols = data[0].length
    const vertices = []
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const value = data[i][j]?.type
            if (!value) continue
            const color = colormap[value]
            if (!color) continue

            const x1 = -1 + j * xsize
            const y1 = -1 + i * ysize
            const x2 = x1 + xsize
            const y2 = y1 + ysize

            vertices.push(
                x1, y1, ...color,
                x2, y1, ...color,
                x2, y2, ...color,
                x1, y1, ...color,
                x2, y2, ...color,
                x1, y2, ...color,
            )
        }
    }
    return vertices
}

// init render
const vert_wgsl = `
struct VertexInput {
    @location(0) position: vec2<f32>,
    @location(1) color: vec4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput
    output.position = vec4<f32>(input.position, 0.0, 1.0)
    output.color = input.color
    return output
}
`

const frag_wgsl = `
struct FragmentInput {
    @location(0) color: vec4<f32>
}

struct FragmentOutput {
    @location(0) color: vec4<f32>
}

@fragment
fn main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput
    output.color = input.color
    return output
}
`

async function init(canvas) {
    if (!navigator?.gpu?.requestAdapter) {
        return webglInit(canvas)
    }
    let adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
        console.warn('Failed to get WebGPU adapter')
        return webglInit(canvas)
    }
    let device = await adapter.requestDevice()
    device.lost.then(async value => {
        device = null
        adapter = null
        await init(canvas)
    })
    const context = canvas.getContext('webgpu')
    if (!context) return
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
    context.configure({
        device: device,
        format: presentationFormat,
        alphaMode: "premultiplied",
    })

    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({ code: vert_wgsl }),
            entryPoint: 'main',
            buffers: [{
                arrayStride: 6 * Float32Array.BYTES_PER_ELEMENT,
                attributes: [
                    {
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x2',
                    },
                    {
                        shaderLocation: 1,
                        offset: 2 * Float32Array.BYTES_PER_ELEMENT,
                        format: 'float32x4',
                    },
                ],
            }],
        },
        fragment: {
            module: device.createShaderModule({ code: frag_wgsl }),
            entryPoint: 'main',
            targets: [{ format: presentationFormat }],
        },
        primitive: {
            topology: 'triangle-list',
            cullMode: 'back',
        },
    })

    return function render(data, xsize, ysize) {
        const vertices = new Float32Array(loadData(data, xsize, ysize))
        const VertexBuffer = device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        })

        new Float32Array(VertexBuffer.getMappedRange()).set(vertices)
        VertexBuffer.unmap()

        const renderPassDescriptor = {
            colorAttachments: [
                {
                    view: context.getCurrentTexture().createView(),
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: "clear",
                    storeOp: 'store',
                },
            ],
        }

        // Encode the commands to render the data
        const commandEncoder = device.createCommandEncoder()
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
        passEncoder.setPipeline(pipeline)
        passEncoder.setVertexBuffer(0, VertexBuffer)
        passEncoder.draw(vertices.length / 6, 1, 0, 0)
        passEncoder.end()

        // Submit the commands to the GPU queue
        device.queue.submit([commandEncoder.finish()])
    }
}

// downgrade webgl
function webglInit(canvas) {
    const vert_glsl = `
        attribute vec2 position
        attribute vec4 color

        varying vec4 vColor

        void main() {
        gl_Position = vec4(position, 0.0, 1.0)
        vColor = color
        }`

    const frag_glsl = `
        precision mediump float

        varying vec4 vColor

        void main() {
        gl_FragColor = vColor
        }`
    const gl = canvas.getContext('webgl')
    if (!gl) {
        document.body.innerHTML = '<h1>当前浏览器/设备不支持WebGPU<br>The current browser/device does not support WebGPU</h1><br><h1>当前浏览器不支持WebGL<br>The current browser does not support WebGL</h1>'
        return null
    }
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, vert_glsl)
    gl.compileShader(vertexShader)

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, frag_glsl)
    gl.compileShader(fragmentShader)

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    return function render(data, xsize, ysize) {
        const vertices = loadData(data, xsize, ysize)
        const VertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, VertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.useProgram(program)

        const positionLocation = gl.getAttribLocation(program, 'position')
        const colorLocation = gl.getAttribLocation(program, 'color')

        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0)

        gl.enableVertexAttribArray(colorLocation)
        gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT)

        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 6)
    }
}

// helper
function emptyMatrix(width, height) { return new Array(height).fill(true).map(() => new Array(width).fill(null)) }