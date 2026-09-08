import cv2
import numpy as np


def find_document_contour(gray: np.ndarray) -> np.ndarray | None:
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    edges = cv2.dilate(edges, np.ones((5, 5), np.uint8), iterations=1)
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    image_area = gray.shape[0] * gray.shape[1]
    for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:5]:
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        # A 4-point contour covering a meaningful fraction of the frame
        # is our best guess at "the paper sheet" rather than noise.
        if len(approx) == 4 and cv2.contourArea(approx) > 0.2 * image_area:
            return approx.reshape(4, 2)
    return None


def order_points(pts: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # top-left
    rect[2] = pts[np.argmax(s)]  # bottom-right
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right
    rect[3] = pts[np.argmax(diff)]  # bottom-left
    return rect


def warp_to_document(image: np.ndarray, contour: np.ndarray) -> np.ndarray:
    rect = order_points(contour.astype("float32"))
    (tl, tr, br, bl) = rect
    max_width = int(max(np.linalg.norm(br - bl), np.linalg.norm(tr - tl)))
    max_height = int(max(np.linalg.norm(tr - br), np.linalg.norm(tl - bl)))
    dst = np.array(
        [[0, 0], [max_width - 1, 0], [max_width - 1, max_height - 1], [0, max_height - 1]],
        dtype="float32",
    )
    matrix = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, matrix, (max_width, max_height))


def correct_perspective(image: np.ndarray, gray: np.ndarray) -> tuple[np.ndarray, bool]:
    """Best-effort deskew: finds the largest quadrilateral contour and warps
    it to a flat rectangle. Falls back to the original image untouched
    (deskewed=False) when no confident document boundary is found — better
    than a wrong warp distorting text beyond what OCR can read."""
    contour = find_document_contour(gray)
    if contour is None:
        return image, False
    return warp_to_document(image, contour), True
