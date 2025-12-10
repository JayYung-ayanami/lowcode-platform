import type { ComponentSchema } from '../types/schema';

/**
 * 在组件树中查找指定 ID 的节点
 * 采用深度优先遍历 (DFS)
 * 
 * @param node 当前遍历的根节点
 * @param id 要查找的目标节点 ID
 * @returns 找到的节点对象，如果没找到返回 null
 */
export const findNode = (node: ComponentSchema, id: string): ComponentSchema | null => {
  // 1. 递归终止条件：当前节点就是目标节点
  if (node.id === id) return node;

  // 2. 递归遍历子节点
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, id);
      // 如果在子树中找到了，直接逐层返回
      if (found) return found;
    }
  }
  
  // 3. 遍历完所有子节点都没找到
  return null;
};

/**
 * 查找指定节点的父节点 ID 和其在父节点中的索引位置
 * 
 * @param node 当前遍历的根节点
 * @param targetId 要查找的目标节点 ID
 * @returns { parentId, index } 包含父ID和索引的对象，没找到返回 null
 */
export const findParentAndIndex = (node: ComponentSchema, targetId: string): { parentId: string; index: number } | null => {
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      // 1. 检查直接子节点是否匹配
      if (node.children[i].id === targetId) {
        // 找到了！当前 node 就是它的父亲，i 就是它的索引
        return { parentId: node.id, index: i }
      }
      
      // 2. 递归去子节点的子树里找
      const result = findParentAndIndex(node.children[i], targetId)
      // 如果在深层找到了，直接返回结果
      if (result) return result
    }
  }
  // 遍历完没找到
  return null
}
