let handPose;
let video;
let hands = [];
let options = {flipped: true};

let dog = { x: 320, y: 240, size: 80 };
let heart = { x: 100, y: 100, size: 60 };
let score = 0;

// 食物符號與資料
let foodEmojis = ["🍓"]; // 只保留草莓
let foods = [];

// 計時相關
let totalTime = 30; // 秒
let startTime;
let gameOver = false;

let fireworks = []; // 新增煙火陣列

function preload() {
  handPose = ml5.handPose(options);
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, options);
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);
  resetHeart();

  // 產生 50 個隨機大小的草莓
  for (let i = 0; i < 50; i++) {
    let emoji = "🍓";
    let size = random(20, 60);
    let angle = random(TWO_PI);
    let speed = random(1, 3);
    foods.push({
      emoji: emoji,
      x: random(width),
      y: random(height),
      size: size,
      dx: cos(angle) * speed,
      dy: sin(angle) * speed
    });
  }

  startTime = millis();
}

function draw() {
  background(255);
  image(video, 0, 0, width, height);

  // 倒數計時
  let elapsed = int((millis() - startTime) / 1000);
  let timeLeft = max(0, totalTime - elapsed);

  // 遊戲結束
  if (timeLeft <= 0) {
    gameOver = true;
    fill(0, 180);
    rect(0, 0, width, height);
    fill("#fff");
    textSize(64);
    textAlign(CENTER, CENTER);
    text("遊戲結束", width / 2, height / 2 - 40);
    textSize(40);
    text("分數: " + score, width / 2, height / 2 + 30);

    // 產生煙火
    if (fireworks.length < 10) { // 只產生一次
      for (let i = 0; i < 10; i++) {
        fireworks.push(new Firework(random(width * 0.2, width * 0.8), random(height * 0.2, height * 0.8)));
      }
    }
    // 更新與顯示煙火
    for (let fw of fireworks) {
      fw.update();
      fw.show();
    }
    noLoop();
    return;
  }

  // 畫飄動的食物
  textAlign(CENTER, CENTER);
  for (let i = 0; i < foods.length; i++) {
    let f = foods[i];
    textSize(f.size);
    text(f.emoji, f.x, f.y);
    f.x += f.dx;
    f.y += f.dy;
    // 邊界反彈
    if (f.x < 0 || f.x > width) f.dx *= -1;
    if (f.y < 0 || f.y > height) f.dy *= -1;
  }

  // 取得食指指尖座標控制狗（平滑移動）
  if (hands.length > 0) {
    let keypoints = hands[0].keypoints;
    if (keypoints && keypoints[8]) {
      dog.x += (keypoints[8].x - dog.x) * 0.2;
      dog.y += (keypoints[8].y - dog.y) * 0.2;
    }
  }

  // 畫多個漂移的 tkuet（棕色立體字效果）並檢查碰撞
  let txt = "tkuet";
  textStyle(BOLD);
  let hit = false; // 是否碰撞
  for (let i = 0; i < 5; i++) { // 產生5個漂移的 tkuet
    let angle = frameCount * 0.01 + i * PI / 2.5;
    let radius = 80 + i * 30;
    let x = heart.x + cos(angle) * radius;
    let y = heart.y + sin(angle) * radius;

    textSize(heart.size - i * 10);
    textAlign(CENTER, CENTER);

    // 棕色立體陰影層
    for (let j = 10; j > 0; j--) {
      fill(101, 67, 33, 40); // 棕色半透明
      text(txt, x + j, y + j);
    }
    // 主體白色描邊
    stroke(255);
    strokeWeight(8);
    fill(101, 67, 33); // 主體棕色
    text(txt, x, y);
    noStroke();

    // 碰撞偵測（以狗中心與tkuet中心距離判斷，半徑可依需求調整）
    let d = dist(dog.x, dog.y, x, y);
    if (d < (dog.size + (heart.size - i * 10)) / 2) {
      hit = true;
    }
  }

  // 若碰到tkuet立體字就得分
  if (hit) {
    score++;
    resetHeart();

    // 得分時閃爍顏色
    push();
    textAlign(CENTER, CENTER);
    textSize(heart.size + 20);
    stroke(255, 215, 0); // 金色外框
    strokeWeight(8);
    fill(0, 200, 255); // 藍綠色
    text("得分!", width / 2, height / 2);
    pop();
  }

  // 畫大狗
  textSize(dog.size);
  text("🐶", dog.x, dog.y);

  // 碰撞偵測
  let d = dist(dog.x, dog.y, heart.x, heart.y);
  if (d < (dog.size + heart.size) / 2) {
    score++;
    resetHeart();

    // 得分時閃爍顏色
    push();
    textAlign(CENTER, CENTER);
    textSize(heart.size + 20);
    stroke(255, 215, 0); // 金色外框
    strokeWeight(8);
    fill(0, 200, 255); // 藍綠色
    text("得分!", width / 2, height / 2);
    pop();
  }

  // 顯示分數（右上角，金色大字+陰影）
  textAlign(RIGHT, TOP);
  textSize(40);
  stroke(120, 80, 0, 180); // 金色陰影
  strokeWeight(6);
  fill(255, 215, 0); // 金色
  text("分數: " + score, width - 20, 20);
  noStroke();

  // 顯示倒數計時（左上角，紅色大字+白色描邊）
  textAlign(LEFT, TOP);
  textSize(40);
  stroke(255); // 白色描邊
  strokeWeight(6);
  fill(220, 30, 30); // 鮮紅色
  text("時間: " + timeLeft, 20, 20);
  noStroke();
}

function resetHeart() {
  heart.x = random(50, width - 50);
  heart.y = random(50, height - 50);
}

function gotHands(results) {
  hands = results;
}

// 煙火粒子類別
class Firework {
  constructor(x, y) {
    this.particles = [];
    let colors = [
      color(255, 0, 0), color(255, 255, 0), color(0, 255, 0),
      color(0, 255, 255), color(0, 0, 255), color(255, 0, 255),
      color(255, 128, 0), color(255, 255, 255)
    ];
    let c = random(colors);
    for (let i = 0; i < 50; i++) {
      let angle = random(TWO_PI);
      let speed = random(2, 7);
      this.particles.push({
        x: x,
        y: y,
        dx: cos(angle) * speed,
        dy: sin(angle) * speed,
        alpha: 255,
        col: c
      });
    }
  }
  update() {
    for (let p of this.particles) {
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.05; // 重力
      p.dx *= 0.98;
      p.dy *= 0.98;
      p.alpha -= 4;
    }
  }
  show() {
    noStroke();
    for (let p of this.particles) {
      fill(red(p.col), green(p.col), blue(p.col), p.alpha);
      ellipse(p.x, p.y, 6);
    }
  }
}
