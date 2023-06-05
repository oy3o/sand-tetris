// init render
const canvas = document.getElementById("canvas")
let speed = 2
let width = 12
let height = 24
let running = null
let rendered = ''
let render = null

function checkView() {
    let frame = ''
    for (let i = position.data.length - 1; i >= 0; i--) {
        frame += position.data[i].map(i => i ? i.type : ' ').join('') + '\n'
    }
    if (frame != rendered) {
        rendered = frame
        render(position.data, 2 / width, 2 / height)
        console.log(frame)
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

// register key
document.addEventListener('keydown', ({ code }) => {
    switch (code) {
        case 'ArrowLeft':
            if (leftable(speed)) {
                controling.forEach(c => {
                    let { x, y } = position.get(c)
                    position.set(c, { x: x - speed, y })
                    position.data[y][x - speed] = position.data[y][x]
                    position.data[y][x] = null
                })
                checkView()
            }
            break
        case 'ArrowRight':
            if (rightable(width, speed)) {
                controling.reverse().forEach(c => {
                    let { x, y } = position.get(c)
                    position.set(c, { x: x + speed, y })
                    position.data[y][x + speed] = position.data[y][x]
                    position.data[y][x] = null
                })
                controling.reverse()
                checkView()
            }
            break
        case 'ArrowDown':
            if (controlable()) {
                controling.reverse().forEach(c => {
                    let { x, y } = position.get(c)
                    position.set(c, { x, y: y - speed })
                    position.data[y - speed][x] = position.data[y][x]
                    position.data[y][x] = null
                })
                controling.reverse()
                checkView()
            }
            break
    }
})


async function start() {
    if (!render) render = await init(canvas)
    speed = 3 * parseInt(document.getElementById('speed').value)
    width = 6 * parseInt(document.getElementById('width').value)
    height = 6 * parseInt(document.getElementById('height').value)
    window.position = new dimension('position', emptyMatrix(width, height), flowsand, checkPosition)

    running = setInterval(() => {
        dimension.next()
        requestAnimationFrame(checkView)
    }, 100 / speed)
}

document.getElementById('button').addEventListener('click', () => {
    if (running) clearInterval(running)
    start()
})

document.getElementById('speedset').addEventListener('click', () => {
    if (running) clearInterval(running)
    speed = 3 * parseInt(document.getElementById('speed').value)
    running = setInterval(() => {
        dimension.next()
        requestAnimationFrame(checkView)
    }, 100 / speed)
})