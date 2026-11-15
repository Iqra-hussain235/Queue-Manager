export function toQueueOutput(queue, counts = {}) {
  return {
    id: queue.id,
    name: queue.name,
    description: queue.description,
    status: queue.status,
    createdAt: queue.createdAt,
    updatedAt: queue.updatedAt,
    stats: {
      waiting: Number(counts.WAITING || 0),
      called: Number(counts.CALLED || 0),
      serving: Number(counts.SERVING || 0),
      completed: Number(counts.COMPLETED || 0),
      cancelled: Number(counts.CANCELLED || 0),
    },
  };
}
