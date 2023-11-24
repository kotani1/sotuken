'use strict'
const canvas = document.querySelector("#canvas");
const context = canvas.getContext("2d");


class Ellipse{
  x_radius = 100
  y_radius = 50
  constructor( x, y,text_x,text_y ) {
    this.x = x;
    this.y = y;
    this.text_x = text_x;
    this.text_y = text_y;
  }

  // 楕円を描く
  draw(){
    context.beginPath();
  //中心のx座標, 中心のy座標, x方向の半径, y方向の半径,傾き, 開始角度, 終了角度, [回転方向]
    context.ellipse(this.x, this.y, this.x_radius, this.y_radius, 0, 0, Math.PI * 2);
    context.stroke();
    context.font = "25px serif";
    context.fillText("Hello", this.text_x, this.text_y);
  }
}

function drawLine(startX, startY, endX, endY) {
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
}

let first_point = new Ellipse(600,100,550,110)
first_point.draw()


  let count = 2
// for(let i=1; i<5; i++){
//   if(i%2==1){
//     console.log('hajime')
//     left_point = {x:first_point.x/2,
//     y:first_point.y*3,
//     text_x:first_point.text_x-300,
//     text_y:first_point.text_y+200}
//     drawCircle(left_point.x,
//       left_point.y,
//       left_point.text_x,
//       left_point.text_y)
//     drawLine(first_point.x,first_point.y+y_radius,left_point.x,left_point.y-y_radius)
//     console.log("left_point")
//     console.log(left_point)
//   }else if(i%2==0){
//     right_point = {x:first_point.x*1.5,
//       y:first_point.y*3,
//       text_x:first_point.text_x+300,
//       text_y:first_point.text_y+200}
//     drawCircle(right_point.x,
//       right_point.y,
//       right_point.text_x,
//       right_point.text_y)
//     drawLine(first_point.x,first_point.y+y_radius,right_point.x,right_point.y-y_radius)
//     first_point = left_point
//     console.log(first_point)
//   }
//   // left_x = x/2
//   // left_y = y*3
//   number++;
// }



// var w = $('.wrapper').width();
// var h = $('.wrapper').height();
// $('#canvas').attr('width', w);
// $('#canvas').attr('height', h);

