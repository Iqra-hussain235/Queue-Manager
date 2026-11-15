export function toTokenOutput(token) {
  return {
    id: token.id,
    tokenNumber: token.tokenNumber,
    personName: token.personName,
    personContact: token.personContact,
    queueId: token.queueId,
    position: token.position,
    status: token.status,
    createdAt: token.createdAt,
    calledAt: token.calledAt,
    serviceStartedAt: token.serviceStartedAt,
    completedAt: token.completedAt,
    cancelledAt: token.cancelledAt,
    waitingSeconds: token.calledAt
      ? Math.max(0, Math.floor((new Date(token.calledAt) - new Date(token.createdAt)) / 1000))
      : token.status === "WAITING"
        ? Math.max(0, Math.floor((Date.now() - new Date(token.createdAt)) / 1000))
        : null,
  };
}
