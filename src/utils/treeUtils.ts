import type { ComponentSchema } from '../types/schema';

export const findNode = (node: ComponentSchema, id: string): ComponentSchema | null => {
  if (node.id === id) return node;

  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  
  return null;
};

// 查找节点的父节点和其在父节点中的索引位置
export const findParentAndIndex = (node: ComponentSchema, targetId: string): { parentId: string; index: number } | null => {
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      if (node.children[i].id === targetId) {
        return { parentId: node.id, index: i }
      }
      
      // 递归在子节点的子树里找
      const result = findParentAndIndex(node.children[i], targetId)
      if (result) return result
    }
  }
  
  return null
}
