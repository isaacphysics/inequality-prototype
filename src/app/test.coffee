
myp = new p5 (p)->
  p.setup = ->
    p.createCanvas p.windowWidth, p.windowHeight
    p.frameRate 60

  p.draw = ->
    if p.mouseIsPressed
      p.fill p.random 255
    else
      p.stroke "dodgerBlue"
      p.fill 255
    p.ellipse p.mouseX, p.mouseY, 80, 80

 
