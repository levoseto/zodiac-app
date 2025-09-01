<template>
  <div class="alert" :class="type === 'success' ? 'alert-success' : 'alert-error'">
    {{ message }}
  </div>
</template>

<script>
export default {
  name: 'AlertMessage',
  props: {
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'success',
      validator: (value) => ['success', 'error'].includes(value)
    }
  }
}
</script>