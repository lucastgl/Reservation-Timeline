import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {Task} from './types';

type CardProps = {
    task: Task
};

export function TaskCard({ task }: CardProps) {

    const {setNodeRef, attributes, listeners, transform, transition, isDragging} = useSortable({id: task.id})

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return(
        <div 
            ref={setNodeRef} 
            {...attributes} 
            {...listeners} 
            className='cursor-grab rounded-lg bg-neutral-700 p-4 shadow-sm hover:shadow-md'
            style={style}
        >
            <h3 className='font-medium text-neutral-100'>
                {task.title}
            </h3>
            <p className='mt-2 text-sm text-neutral-400'>
                {task.description}
            </p>
        </div>
    )

}