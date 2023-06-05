// init render
const canvas = document.getElementById("canvas")
const movespeed = 3
let speed = 2
let width = 12
let height = 24
let running = null
let rendered = ''
let render = null
let level = 5

function checkView() {
    let frame = ''
    for (let i = position.data.length - 1; i >= 0; i--) {
        frame += position.data[i].map(i => i ? i.type : ' ').join('') + '\n'
    }
    if (frame != rendered) {
        rendered = frame
        render(position.data, 2 / width, 2 / height)
        // console.log(frame)
    }
    if (!controlable()) {
        controling.length = 0
        checkControl.length = 0
        checkLeft.length = 0
        checkRight.length = 0
        if (!addBlock(height, width / 2)) {
            clearInterval(running)
            running = null
        }
    }
}

// handle action
function ArrowLeft() {
    if (leftable(movespeed)) {
        controling.forEach(c => {
            let { x, y } = position.get(c)
            position.set(c, { x: x - movespeed, y })
            position.data[y][x - movespeed] = position.data[y][x]
            position.data[y][x] = null
        })
        checkView()
    }
}

function ArrowRight() {
    if (rightable(width, movespeed)) {
        controling.reverse().forEach(c => {
            let { x, y } = position.get(c)
            position.set(c, { x: x + movespeed, y })
            position.data[y][x + movespeed] = position.data[y][x]
            position.data[y][x] = null
        })
        controling.reverse()
        checkView()
    }
}

function ArrowDown() {
    if (controlable()) {
        controling.reverse().forEach(c => {
            let { x, y } = position.get(c)
            position.set(c, { x, y: y - movespeed })
            position.data[y - movespeed][x] = position.data[y][x]
            position.data[y][x] = null
        })
        controling.reverse()
        checkView()
    }
}

// register key
document.addEventListener('keydown', ({ code }) => {
    switch (code) {
        case 'ArrowLeft':
            ArrowLeft()
            break
        case 'ArrowRight':
            ArrowRight()
            break
        case 'ArrowDown':
            ArrowDown()
            break
    }
})

let rect = canvas.getBoundingClientRect()
let pointerTimer = null
let touchTimer = null
let Downing = false

function handlePointerDown(e) {
    e.preventDefault()
    if (Downing) return;
    if (e.clientX < rect.left + rect.width / 2) {
        ArrowLeft()
        pointerTimer = setTimeout(() => {
            let innerclear = setInterval(() => {
                if ((pointerTimer != innerclear) || Downing) return clearInterval(innerclear)
                ArrowLeft()
            }, 50)
            pointerTimer = innerclear
        }, 500)
    } else {
        ArrowRight()
        pointerTimer = setTimeout(() => {
            let innerclear = setInterval(() => {
                if ((pointerTimer != innerclear) || Downing) return clearInterval(innerclear)
                ArrowRight()
            }, 50)
            pointerTimer = innerclear
        }, 500)
    }
}

function handlePointerUp(e) {
    e.preventDefault()
    if (pointerTimer) {
        clearTimeout(pointerTimer)
        pointerTimer = null
    }
}

function handleTouchStart(e) {
    e.preventDefault()
    if (e.touches.length === 2) {
        clearTimeout(pointerTimer)
        pointerTimer = null
        Downing = true
        ArrowDown()
        touchTimer = setTimeout(() => touchTimer = setInterval(ArrowDown, 50), 500)
    }
}

function handleTouchEnd(e) {
    e.preventDefault()
    if (touchTimer) {
        clearTimeout(touchTimer)
        touchTimer = null
        Downing = false
    }
}

canvas.addEventListener('touchstart', handleTouchStart, false)
canvas.addEventListener('touchend', handleTouchEnd, false)
canvas.addEventListener('pointerdown', handlePointerDown, false)
canvas.addEventListener('pointerup', handlePointerUp, false)

async function start() {
    if (!render) render = await init(canvas)
    if (!render) document.body.innerHTML += '<br><h1>运行失败<br>Run Failed</h1>'
    speed = 3 * parseFloat(document.getElementById('speed').value)
    width = 6 * parseInt(document.getElementById('width').value)
    height = 6 * parseInt(document.getElementById('height').value)
    level = Math.min(colormap.length - 1, parseInt(document.getElementById('color').value))
    document.getElementById('color').value = level
    window.position = new dimension('position', emptyMatrix(width, height), flowsand, checkPosition)

    running = setInterval(() => {
        dimension.next()
        requestAnimationFrame(checkView)
    }, 100 / speed)
}

document.getElementById('speedset').addEventListener('click', () => {
    if (running) clearInterval(running)
    let value = Math.max((level / 3 * 10 | 0) / 10, parseFloat(document.getElementById('speed').value))
    document.getElementById('speed').value = value
    speed = 3 * value
    running = setInterval(() => {
        dimension.next()
        requestAnimationFrame(checkView)
    }, 100 / speed)
})

document.getElementById('L1').addEventListener('click', () => {
    if (running) clearInterval(running)
    document.getElementById('speed').value = 1
    document.getElementById('width').value = 12
    document.getElementById('height').value = 24
    document.getElementById('color').value = 3
    start()
})
document.getElementById('L2').addEventListener('click', () => {
    if (running) clearInterval(running)
    document.getElementById('speed').value = 1.6
    document.getElementById('width').value = 16
    document.getElementById('height').value = 32
    document.getElementById('color').value = 5
    start()
})
document.getElementById('L3').addEventListener('click', () => {
    if (running) clearInterval(running)
    document.getElementById('speed').value = 2.2
    document.getElementById('width').value = 20
    document.getElementById('height').value = 40
    document.getElementById('color').value = 7
    start()
})
document.getElementById('L4').addEventListener('click', () => {
    if (running) clearInterval(running)
    document.getElementById('speed').value = 3
    document.getElementById('width').value = 24
    document.getElementById('height').value = 48
    document.getElementById('color').value = colormap.length - 1
    start()
})
document.getElementById('custom').addEventListener('click', () => {
    if (running) clearInterval(running)
    start()
})
start()