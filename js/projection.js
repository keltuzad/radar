
function RotatePoint(center, angle, point)
{
  const s = Math.sin(angle);
  const c = Math.cos(angle);

  // translate point back to origin:
  point.x -= center.x;
  point.y -= center.y;

  // rotate point
  const xnew = point.x * c - point.y * s;
  const ynew = point.x * s + point.y * c;

  // translate point back:
  point.x = xnew + center.x;
  point.y = ynew + center.y;
  return point;
}

function Calculate2DPos(center, rotation, pos)
{
  return RotatePoint(glm.vec2(0, 0), rotation, pos);
}

function ToMap(point, center, angle, screenSize, multiplier = 1)
{
  const temp2DPos = glm.vec2(point.x, point.z);
  let onScreenPos = temp2DPos['-'](glm.vec2(center.x, center.z));
  onScreenPos.y *= -1;
  onScreenPos = Calculate2DPos(glm.vec2(0, 0), (angle) * -1 * 0.0174533, onScreenPos);
  const screenPos = (onScreenPos['*'](glm.vec2(multiplier, multiplier)))['+'](glm.vec2(screenSize.x / 2, screenSize.y / 2));
  const isOnScreen = (screenPos.x > 0 && screenPos.y > 0 && screenPos.x < screenSize.x && screenPos.y < screenSize.y);
  return {
    isOnScreen,
    screenPos
  };
}

function GetForwardVec(pitch, yaw, pos)
{
  const elevation = glm.radians(-pitch);
  const heading = glm.radians(yaw);
  const forwardVec = glm.vec3(Math.cos(elevation) * Math.sin(heading), Math.sin(elevation), Math.cos(elevation) * Math.cos(heading));
  return forwardVec;
}

function WorldToScreen(pos, view, proj, res)
{
  const viewOffset = glm.vec2(0, 0);
  const clipSpacePos = glm.vec4(proj['*']((view['*'](glm.vec4(pos, 1.0)))));
  const ndcSpacePos = glm.vec3(clipSpacePos.x / clipSpacePos.w, clipSpacePos.y / clipSpacePos.w, clipSpacePos.z / clipSpacePos.w);
  if (ndcSpacePos.z > 1) return false;
  const windowSpacePos = glm.vec2(((ndcSpacePos.x + 1.0) / 2.0) * res.x + viewOffset.x, ((1.0 - ndcSpacePos.y) / 2.0) * res.y + viewOffset.y);
  let onScreenPos = glm.vec2(windowSpacePos.x, windowSpacePos.y);
  const isOnScreen = (onScreenPos.x > 0 && onScreenPos.x < res.x && onScreenPos.y > 0 && onScreenPos.y < res.y);
  return {
    isOnScreen,
    onScreenPos
  };
}
