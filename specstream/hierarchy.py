def build_hierarchy(classified_items):
    """
    Build a parent-child tree from classified items (in reading order).
    Returns the root node (a dummy node) whose children are the top-level elements.
    Each node is a dict with keys:
        - 'type': one of 'heading', 'warning', 'footnote', 'table', 'spec'
        - 'text': the text string
        - 'bbox': (x0, y0, x1, y1)
        - 'font_size': font size
        - 'heading_depth': only for headings, the depth (number of dot-separated groups)
        - 'children': list of child nodes
    """
    # We'll create a root node
    root = {
        'type': 'root',
        'text': '',
        'bbox': (0, 0, 0, 0),
        'font_size': 0,
        'children': []
    }
    # Stack will store tuples of (depth, node) for headings only
    stack = []  # each element is (depth, node)

    for item in classified_items:
        # Create a node for this item
        node = {
            'type': item['type'],
            'text': item['text'],
            'bbox': item['bbox'],
            'font_size': item['font_size'],
            'children': []
        }
        if item['type'] == 'heading':
            node['heading_depth'] = item['heading_depth']
            depth = node['heading_depth']
            # Pop from stack until we find a heading with depth < current depth
            while stack and stack[-1][0] >= depth:
                stack.pop()
            if stack:
                parent_node = stack[-1][1]
            else:
                parent_node = root
            parent_node['children'].append(node)
            stack.append((depth, node))
        else:
            # Non-heading: attach to the last heading in the stack, or to root if none
            if stack:
                parent_node = stack[-1][1]
            else:
                parent_node = root
            parent_node['children'].append(node)

    return root

def export_json_tree(root):
    """
    Convert the tree to a JSON-serializable structure, skipping the root node.
    Returns a list of top-level nodes.
    """
    def _export(node):
        # Exclude the root node
        if node['type'] == 'root':
            return [ _export(child) for child in node['children'] ]
        # For other nodes, return a dict with the node's data and exported children
        result = {
            'type': node['type'],
            'label': node['text'],  # using 'label' as per CLAUDE.md's output format
            'bbox': {
                'x': node['bbox'][0],
                'y': node['bbox'][1],
                'w': node['bbox'][2] - node['bbox'][0],
                'h': node['bbox'][3] - node['bbox'][1]
            }
        }
        if node['type'] == 'heading':
            result['heading_depth'] = node['heading_depth']
        if node['children']:
            result['children'] = [_export(child) for child in node['children']]
        return result

    # The root's export is a list of top-level nodes
    return _export(root)

if __name__ == "__main__":
    import sys
    sys.path.append('.')
    from extraction import extract_text_items
    from classification import classify_items
    if len(sys.argv) < 2:
        print("Usage: python hierarchy.py <pdf_path>")
        sys.exit(1)
    items = extract_text_items(sys.argv[1])
    classified = classify_items(items)
    hierarchy = build_hierarchy(classified)
    json_tree = export_json_tree(hierarchy)
    import json
    print(json.dumps(json_tree, indent=2))