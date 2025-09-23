ZPNetEvents.allow({
    insert(userId, doc) {
        return true
    },
    update(userId, doc) {
        return true
    },
    remove(userId) {
        return true
    },
    fetch: ["domain"]
})

