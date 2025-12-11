import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAppSelector } from '../../store/hook';
import { RenderComponent } from '../RenderComponent';

// 画布区域组件
const CanvasArea: React.FC<{ children: React.ReactNode; items: string[] }> = ({ children, items }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas-root',
    data: { isCanvas: true }
  })

  const style = {
    minHeight: '100%',
    border: isOver ? '2px dashed #1890ff' : '1px solid transparent',
    transition: 'all 0.2s',
    padding: '20px'
  }

  return (
    <div ref={setNodeRef} style={style} className='canvas-paper'>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  )
}

export const CanvasPanel: React.FC<{ overId: string | null; activeId: string | null; involvedIds?: Set<string> }> = ({ overId, activeId, involvedIds }) => {
  const page = useAppSelector((state) => state.project.present.page);

  return (
    <div className="canvas-area">
      <CanvasArea items={page.root.children?.map(c => c.id) || []}>
        {page.root.children?.map(child => (
          <RenderComponent 
            key={child.id} 
            schema={child} 
            isSortable={true} 
            overId={overId} 
            activeId={activeId} 
            involvedIds={involvedIds} 
          />
        ))}
      </CanvasArea>
    </div>
  );
};
