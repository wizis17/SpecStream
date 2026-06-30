def xycut(items, h_gap=10, v_gap=10):
    """
    Recursive XY-cut algorithm to determine reading order.
    Args:
        items: list of dicts, each with 'bbox' (x0, y0, x1, y1)
        h_gap: minimum horizontal gap (vertical whitespace) to cut
        v_gap: minimum vertical gap (horizontal whitespace) to cut
    Returns:
        list of items in reading order (top to bottom, left to right)
    """
    if not items:
        return []

    # Compute the bounding box of the current items
    xs0 = [item['bbox'][0] for item in items]
    ys0 = [item['bbox'][1] for item in items]
    xs1 = [item['bbox'][2] for item in items]
    ys1 = [item['bbox'][3] for item in items]
    region = (min(xs0), min(ys0), max(xs1), max(ys1))
    x0, y0, x1, y1 = region
    # Debug print
    # print(f"DEBUG: region: x0={x0}, y0={y0}, x1={x1}, y1={y1}")

    # Helper to check if a gap exists in a projection
    def find_gap(intervals, start, end, gap_threshold, is_horizontal):
        """
        Find a gap of at least gap_threshold in the merged intervals within [start, end].
        intervals: list of (a, b) intervals (a <= b)
        start, end: the range to consider
        gap_threshold: minimum gap size
        is_horizontal: if True, we are looking for horizontal gap (vertical whitespace)
                       so we project onto y-axis and look for gaps in y.
                       Actually, let's clarify:
                       - Horizontal cut: we split the region into top and bottom by a horizontal line.
                         This requires a gap in the vertical direction (y-axis) that spans the full width.
                         So we project the items onto the y-axis to get occupied y-intervals.
                       - Vertical cut: we split into left and right by a vertical line.
                         This requires a gap in the horizontal direction (x-axis) that spans the full height.
                         So we project onto the x-axis.
        """
        if not intervals:
            # No items, so the entire range is a gap
            if end - start >= gap_threshold:
                return start  # gap starts at start
            else:
                return None

        # Sort intervals by start
        sorted_intervals = sorted(intervals, key=lambda x: x[0])
        merged = []
        current = sorted_intervals[0]
        for interval in sorted_intervals[1:]:
            if interval[0] <= current[1]:  # overlap or touching
                current = (current[0], max(current[1], interval[1]))
            else:
                merged.append(current)
                current = interval
        merged.append(current)

        # Now look for gaps between merged intervals
        prev_end = start
        for interval in merged:
            gap_start = prev_end
            gap_end = interval[0]
            if gap_end - gap_start >= gap_threshold:
                # Debug print
                # print(f"DEBUG: found gap in {'y' if is_horizontal else 'x'} from {gap_start} to {gap_end}")
                return gap_start  # return the start of the gap
            prev_end = interval[1]
        # Check after the last interval
        gap_start = prev_end
        gap_end = end
        if gap_end - gap_start >= gap_threshold:
            # Debug print
            # print(f"DEBUG: found gap in {'y' if is_horizontal else 'x'} from {gap_start} to {gap_end}")
            return gap_start
        return None

    # Try horizontal cut first (look for gap in y-axis that spans the full width)
    # Project items onto y-axis: each item gives an interval [y0, y1]
    y_intervals = [(item['bbox'][1], item['bbox'][3]) for item in items]
    # Debug print
    # print(f"DEBUG: y_intervals: {y_intervals}")
    y_gap_start = find_gap(y_intervals, y0, y1, h_gap, True)
    if y_gap_start is not None:
        # Debug print
        # print(f"DEBUG: horizontal cut at y_gap_start={y_gap_start}")
        # We found a horizontal gap at y_gap_start, of at least h_gap
        # Split into top and bottom
        top_items = [item for item in items if item['bbox'][3] <= y_gap_start]
        bottom_items = [item for item in items if item['bbox'][1] >= y_gap_start + h_gap]
        # Recurse
        return xycut(top_items, h_gap, v_gap) + xycut(bottom_items, h_gap, v_gap)

    # Try vertical cut (look for gap in x-axis that spans the full height)
    x_intervals = [(item['bbox'][0], item['bbox'][2]) for item in items]
    # Debug print
    # print(f"DEBUG: x_intervals: {x_intervals}")
    x_gap_start = find_gap(x_intervals, x0, x1, v_gap, False)
    if x_gap_start is not None:
        # Debug print
        # print(f"DEBUG: vertical cut at x_gap_start={x_gap_start}")
        left_items = [item for item in items if item['bbox'][2] <= x_gap_start]
        right_items = [item for item in items if item['bbox'][0] >= x_gap_start + v_gap]
        return xycut(left_items, h_gap, v_gap) + xycut(right_items, h_gap, v_gap)

    # No cut found: sort by y then x (leaf node)
    return sorted(items, key=lambda item: (item['bbox'][1], item['bbox'][0]))

if __name__ == "__main__":
    # For testing
    import sys
    sys.path.append('.')
    from extraction import extract_text_items
    if len(sys.argv) < 2:
        print("Usage: python xycut.py <pdf_path>")
        sys.exit(1)
    items = extract_text_items(sys.argv[1])
    ordered = xycut(items)
    print("Reading order:")
    for item in ordered:
        print(f"  {item['text']} (bbox: {item['bbox']})")