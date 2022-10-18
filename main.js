const canvasSize = [1920, 1080];

const actionBtn = document.querySelector("#btn");
const audio = document.createElement("audio");
const circleCountEle = document.querySelector("select[name=circleCount]");
const smoothCircleEle = document.querySelector("input[name=smoothCircle]");
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
/** circle | line */
let drawType = "line";
let lineWeight = 1;
/** "default" | "" => default */
let lineColor = "default";
/** Only used in draw type is "circle". */
let circleCount = 1;
let smoothCircle = false;

let audioCtx;
let analyser;
let gainNode;
let isPlaying;
let itv = -1;

function initAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext; // 跨瀏覽器
  audioCtx = new AudioContext();
  analyser = audioCtx.createAnalyser();
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 1;
}

function onClickPlayBtn() {
  if (!audio.src) return;
  if (isPlaying) {
    audio.pause();
    actionBtn.innerHTML = "Play";
    clearInterval(itv);
  } else {
    const media = document.querySelector("#source");
    media.play();
    actionBtn.innerHTML = "Pause";

    itv = setInterval(() => {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);
      const base = 360 / dataArray.length;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight - 28);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight - 28);
      ctx.fill();

      for (let i = 1; i <= circleCount; i++) {
        const pointPositions = Array.from(dataArray).map((d, index) => {
          const angle = index * base + (smoothCircle ? index * 2 : 0);
          const rad = (angle * Math.PI) / 180;
          const x = d * i * Math.cos(rad) + window.innerWidth / 2;
          const y = d * i * Math.sin(rad) + (window.innerHeight - 28) / 2;
          return [d, x, y];
        });

        ctx.beginPath();
        pointPositions.forEach((d, index) => {
          const isDefault = lineColor === "default" || lineColor.trim() === "";
          ctx.strokeStyle = isDefault
            ? `#${getColorHex(
                audio.currentTime * 200,
                audio.duration,
                0
              )}${getColorHex(d[0], 256)}00`
            : lineColor;
          ctx.lineWidth = lineWeight;
          let x = 0;
          let y = 0;
          if (drawType === "circle") {
            x = d[1];
            y = d[2];
          } else if (drawType === "line") {
            x = index * (window.innerWidth / dataArray.length);
            y = dataArray[index] + (window.innerHeight - 28) / 2;
          }
          if (index === 0) ctx.moveTo(x, y);
          ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    }, 20);
  }
  isPlaying = !isPlaying;
}

function getColorHex(value, max) {
  value = Math.floor(value);
  max = Math.floor(max);

  const ratio =
    (Math.floor(value / max) % 2 == 1 ? max - (value % max) : value % max) /
    max;
  const colorValue = Math.floor(256 * ratio);
  let hex = colorValue.toString(16);
  while (hex.length < 2) {
    hex = `0${hex}`;
  }
  return hex;
}

function onKeyDown(event) {
  if (event.code === "Space") {
    event.preventDefault();
    onClickPlayBtn();
  }
}

function onUploadFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    audio.src = reader.result;
    audio.id = "source";
    // audio.hidden = true;
    document.body.append(audio);
    actionBtn.hidden = false;
    initAudio();
    canvas.setAttribute("width", window.innerWidth);
    canvas.setAttribute("height", window.innerHeight - 28);
    const mediaSource = audioCtx.createMediaElementSource(audio);
    mediaSource.connect(analyser);
    mediaSource.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    onClickPlayBtn();
  };
  reader.readAsDataURL(file);
}

function onClickConfirmBtn() {
  lineWeight = document.querySelector("input[name=lineWeight]").value;
  lineColor = document.querySelector("input[name=lineColor]").value;
}

function onSelect(event) {
  circleCount = event.target.value;
}

function onChangedCheckBox(event) {
  smoothCircle = event.target.checked;
}

function onChangedVolume(event) {
  gainNode.gain.value = +event.target.value;
}

window.onload = () => {
  actionBtn.addEventListener("click", onClickPlayBtn);
  document.querySelectorAll("input[name=drawType]").forEach((el) => {
    el.addEventListener("change", (event) => {
      drawType = event.target.value;
      circleCountEle.parentElement.hidden = drawType !== "circle";
      smoothCircleEle.parentElement.hidden = drawType !== "circle";
    });
  });
  document
    .querySelector("#submit")
    .addEventListener("click", onClickConfirmBtn);
  document.querySelector("#file").addEventListener("change", onUploadFile);
  document.querySelector("input[name=volume]").addEventListener("input", onChangedVolume);
  circleCountEle.addEventListener("change", onSelect);
  smoothCircleEle.addEventListener("change", onChangedCheckBox);
  window.addEventListener("keydown", onKeyDown);
};
