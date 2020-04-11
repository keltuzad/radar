
const images = new Map();

function GetImage(bsgId, width, height) {
  if (images.has(bsgId)) {
    const imageData = images.get(bsgId);
    if (imageData.loaded === true) {
      return imageData.img;
    }
    else {
      return true;
    }
  }
  else {
    const img = new Image(width, height);
    const image = {
      loaded: false,
      img: img
    }
    img.onload = () => {
      image.loaded = true;
    };
    img.src = `icons/${bsgId}.png`;
    images.set(bsgId, image);
    return true;
  }
}