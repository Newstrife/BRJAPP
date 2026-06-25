<template>
  <div>
    <h2>设备看板</h2>
    <el-card>设备总数：{{ total }}</el-card>
    <el-card>超期设备：{{ expired }}</el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getList } from '../api/instrument';

const total = ref(0);
const expired = ref(0);

onMounted(async () => {
  const data = await getList();
  total.value = data.length;
  expired.value = data.filter(i => i.calibration_status === 'expired').length;
});
</script>