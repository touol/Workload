
<template>
  <div class="card">
    <Toolbar class="p-mb-4">
      <template #start>
        <Calendar v-model="date" showIcon :showOnFocus="false" dateFormat="dd.mm.yy"/>
        <Button label="Применить"  
          class="p-button-success p-mr-2" 
          @click="loadData" />
        <label>Показывать в таблице</label><InputSwitch v-model="ShowInTable" />
      </template>
    </Toolbar>
    <div class="outer">
      <div class="part smena">
        <h3>Смена</h3>
        <a v-if="Data.tSkladSmena.filter(x=>x.id == currentSmena).length == 1">
          {{ formatDate(Data.tSkladSmena.filter(x=>x.id == currentSmena)[0].date) }} 
          №{{ Data.tSkladSmena.filter(x=>x.id == currentSmena)[0].number }}
        </a>
        <a v-else>
          Для выбора смены шелкните по заголовку столбца таблицы
        </a>
        <h3>Не распределенные</h3>
        <ul>
          <li v-for="staff of Staffs.filter(x=>!Data.gtsBTableList.some(item => item.staff_id === x.id && item.smena_id === currentSmena))"
            >
            <a
            @dragstart="onDragStart($event,staff,'copyStaff')"
            draggable="true"
            @click="editStaff(staff)"
            >{{ staff.fio }} {{ staff.teor_ktu }}</a>
          </li>
        </ul>
        <h3>Распределенные</h3>
        <ul>
          <li v-for="staff of Staffs.filter(x=>Data.gtsBTableList.some(item => item.staff_id === x.id && item.smena_id === currentSmena))"
            >
            <a
            @dragstart="onDragStart($event,staff,'copyStaff')"
            draggable="true"
            @click="editStaff(staff)"
            >{{ staff.fio }} {{ staff.teor_ktu }}</a>
          </li>
        </ul>
      </div>
      <div class="part smens-table">
        <div class="card">
          <table class="p-datatable-table workload-table">
            <thead>
              <th class="naryad"></th>
              <th v-for="smena of Data.tSkladSmena" @click="sCurrentSmena(smena.id)"  
                :style="{backgroundColor: bgColorSmena(smena).color}"
                :class="{ weekend: isWeekend(smena.date) }">
                {{ formatDate(smena.date) }} №{{ smena.number }}
                {{ bgColorSmena(smena).proc }}%
              </th>
            </thead>
            <tbody>
              <tr v-for="tSkladNaryad of Data.tSkladNaryad.filter(x=>x.shown == 1)">
                <td class="naryad">{{ tSkladNaryad.name }}</td>
                <td v-for="smena of Data.tSkladSmena" 
                  :style="{backgroundColor: bgColorSmenaNaryad(smena,tSkladNaryad).color}"
                  :class="{ weekend: isWeekend(smena.date) }"
                  @drop="onDrop($event,smena,tSkladNaryad)"
                  @dragenter.prevent
                  @dragover.prevent
                  >
                  <span>{{ bgColorSmenaNaryad(smena,tSkladNaryad).proc }}%
                    ({{ bgColorSmenaNaryad(smena,tSkladNaryad).sum_teor_time }}/{{ bgColorSmenaNaryad(smena,tSkladNaryad).sum_reserve_time }})</span>
                  <div>
                      <a v-for="table of Data.gtsBTable.filter(x=>x.smena_id === smena.id && x.department_id === tSkladNaryad.department_id)"
                      @dragstart="onDragStartCopyTabel($event, table,'copyTabel')"
                      draggable="true"
                      :href="tabelHref(smena, tSkladNaryad)">
                      Табель №{{ table.id }}

                    </a>
                  </div>
                  <template v-if="ShowInTable && bgColorSmenaNaryad(smena,tSkladNaryad).sum_reserve_time > 0">
                    <table>
                      <tr><td>ФИО</td><td>Ресурс</td><td>Время</td><td>КТУ</td></tr>
                      <tr v-for="tablelist of Data.gtsBTableList.filter(x=>x.smena_id === smena.id && x.department_id === tSkladNaryad.department_id)">
                        <td>
                          <a v-for="staff of Staffs.filter(x=>x.id === tablelist.staff_id)"
                            @dragstart="onDragStartMove($event,staff,tablelist,'moveStaff')"
                            draggable="true"
                            @click="editTableList(tablelist)"
                            >
                            {{ staff.fio }}
                          </a>
                        </td>
                        <td>{{ tablelist.reserve_time }}</td>
                        <td>{{ tablelist.teor_time }}</td>
                        <td>{{ tablelist.teor_ktu }}</td>
                      </tr>
                    </table>
                  </template>
                  <template v-else>
                    <ul class="staff-menu">
                      <li v-for="tablelist of Data.gtsBTableList.filter(x=>x.smena_id === smena.id && x.department_id === tSkladNaryad.department_id)" >
                        <a v-for="staff of Staffs.filter(x=>x.id === tablelist.staff_id)"
                          @dragstart="onDragStartMove($event,staff,tablelist,'moveStaff')"
                          draggable="true"
                          @click="editTableList(tablelist)"
                          >
                          {{ staff.fio }} {{ tablelist.reserve_time }}/{{ tablelist.teor_time }}/{{ tablelist.teor_ktu }}

                        </a>
                      </li>
                    </ul>
                  </template>
                </td>
              
              </tr>
            </tbody>
          </table>
          
        </div>
      </div>
    </div>
    <Toast />
    <Dialog v-model:visible="tableListDialog" 
      :style="{width: '450px'}" 
      header="Редактировать наряд сотрудника" 
      :modal="true" 
      class="p-fluid" >

      <div class="p-field">
          <label for="teor_ktu">Теор. кту</label>
          <InputText id="teor_ktu" v-model.trim="tableList.teor_ktu" required="false" autofocus :class="{'p-invalid': submitted && !tableList.teor_ktu}" />
          <small class="p-error" v-if="submitted && !tableList.teor_ktu">Теор. кту требуется.</small>
      </div>
      <div class="p-field">
          <label for="reserve_time">Ресурсное время</label>
          <InputText id="reserve_time" v-model.trim="tableList.reserve_time" required="false" autofocus :class="{'p-invalid': submitted && !tableList.reserve_time}" />
          <small class="p-error" v-if="submitted && !tableList.reserve_time">Ресурсное время требуется.</small>
      </div>

      <template #footer>
        <Button label="Удалить" icon="pi pi-trash" class="p-button-text" @click="deleteTableList" />
        <Button label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog"/>
        <Button label="Сохранить" icon="pi pi-check" class="p-button-text" @click="saveTableList" />
      </template>
    </Dialog>
    <Dialog v-model:visible="staffDialog" 
      :style="{width: '450px'}" 
      header="Редактировать наряд сотрудника" 
      :modal="true" 
      class="p-fluid" >

      <div class="p-field">
          <label for="teor_ktu">Теор. кту</label>
          <InputText id="teor_ktu" v-model.trim="staff.teor_ktu" required="false" autofocus :class="{'p-invalid': submitted && !staff.teor_ktu}" />
          <small class="p-error" v-if="submitted && !staff.teor_ktu">Теор. кту требуется.</small>
      </div>

      <template #footer>
        <Button label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideStaffDialog"/>
        <Button label="Сохранить" icon="pi pi-check" class="p-button-text" @click="saveStaff" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue';
  import axios from 'axios'
  import Splitter from 'primevue/splitter';
  import SplitterPanel from 'primevue/splitterpanel';
  import { useToast } from "primevue/usetoast";
  import Button from 'primevue/button';
  import Toolbar from 'primevue/toolbar';
  import Calendar from 'primevue/calendar';
  import Dialog from 'primevue/dialog';
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch';

  const toast = useToast();
  const date = ref(new Date());
  onMounted(() => {
    
    getTable('gtsBStaff',{
      query:'cehStaff',
      sortField:'name',
      sortOrder:1
    })
    getTable('tSkladNaryad',{
      sortField:'sort',
      sortOrder:1
    })
    loadData()
  });
  const ShowInTable = ref(true);
  const dt = ref();
  const Data = ref({});
  const Staffs = ref([]);
  const SmenaNaryad = ref([]);
  const loading_gtsBStaff = ref(false);
  const loading_tSkladSmena = ref(false);
  const loading_gtsBTableList = ref(false);
  Data.value['gtsBTableList'] = [];
  Data.value['gtsBTable'] = [];
  Data.value['tSkladNaryad'] = [];
  Data.value['tSkladSmena'] = [];
  Data.value['tSkladNaryadSmena'] = [];
  let smena_ids = []

  //edit staff item
  const staffDialog = ref(false);
  const staff = ref({});
  const editStaff = (item) => 
  {
    staff.value = {...item};
    staffDialog.value = true;
  };
  const hideStaffDialog = () => 
  {
    staffDialog.value = false;
    submitted.value = false;
  };
  
  
  const saveStaff = async () => 
  {
    submitted.value = true;

    if (staff.value.id) 
    {
      
      try{
        const {data} = await axios.post('/api/gtsBStaff',{api_action:'update', ...staff.value})
        if(!data.success){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: data.message, life: 3000 })
          return
        }
      }catch(error){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message, life: 3000 })
          return
      }

      staffDialog.value = false;
      staff.value = {};
      getTable('gtsBStaff',{
        query:'cehStaff',
        sortField:'name',
        sortOrder:1
      })
      submitted.value = false;
    }
  };
  // end edit staff item

  //edit tableList item
  const tableListDialog = ref(false);
  const tableList = ref({});
  const submitted = ref(false);
  const editTableList = (item) => 
  {
    tableList.value = {...item};
    tableListDialog.value = true;
  };
  const hideDialog = () => 
  {
    tableListDialog.value = false;
    submitted.value = false;
  };
  
  const deleteTableList = async () => 
  {
    submitted.value = true;

    if (tableList.value.id) 
    {
      
      try{
        const {data} = await axios.post('/api/gtsBTableList',{api_action:'delete', ids:[tableList.value.id]})
        if(!data.success){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: data.message, life: 3000 })
          return
        }
      }catch(error){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message, life: 3000 })
          return
      }
      tableListDialog.value = false;
      tableList.value = {};
      getTable('gtsBTableList',{
        query:'getTable',
        filters:{
          smena_id:{
            class:'gtsBTable',
            value:smena_ids,
            matchMode:'in'
          },
        },
        sortField:'teor_ktu',
        sortOrder:0
      })
      submitted.value = false;
    }
  };
  const saveTableList = async () => 
  {
    submitted.value = true;

    if (tableList.value.id) 
    {
      try{
        const {data} = await axios.post('/api/gtsBTableList',{api_action:'update', ...tableList.value})
        if(!data.success){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: data.message, life: 3000 })
          return
        }
      }catch(error){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message, life: 3000 })
          return
      }
      tableListDialog.value = false;
      tableList.value = {};
      getTable('gtsBTableList',{
        query:'getTable',
        filters:{
          smena_id:{
            class:'gtsBTable',
            value:smena_ids,
            matchMode:'in'
          },
        },
        sortField:'teor_ktu',
        sortOrder:0
      })
      submitted.value = false;
    }
  };
  // end edit tableList item
  watch(loading_gtsBTableList, () => {
    if(Data.value.gtsBTableList.length > 0){
      Data.value.tSkladSmena.forEach((smena) => {
        let rowsmena = {
          sum_reserve_time:0,
          sum_teor_time:0,
          proc:0,
          color:'#91e97a',
        }
        Data.value.gtsBTableList.filter(x=>x.smena_id === smena.id)
        .forEach((table) => {
          rowsmena.sum_reserve_time += table.reserve_time
          rowsmena.sum_teor_time += table.teor_time
        })
        if(rowsmena.sum_reserve_time > 0) rowsmena.proc = Math.ceil(rowsmena.sum_teor_time/rowsmena.sum_reserve_time*100)
        rowsmena.color = getColor(rowsmena.proc)
        smena.color = rowsmena.color

        Data.value.tSkladNaryad.forEach((naryad) => {
          let row = {
            smena_id:smena.id,
            naryad_id:naryad.id,
            sum_reserve_time:0,
            sum_teor_time:0,
            proc:0,
            color:'#91e97a',
          }
          Data.value.gtsBTableList.filter(x=>x.smena_id === smena.id && x.department_id === naryad.department_id)
          .forEach((table) => {
            row.sum_reserve_time += table.reserve_time
            row.sum_teor_time += table.teor_time
          })
          if(row.sum_reserve_time > 0) row.proc = Math.ceil(row.sum_teor_time/row.sum_reserve_time*100)
          row.color = getColor(row.proc)
          SmenaNaryad.value.push(row)
        });
      });
      loading_gtsBTableList.value = false
    }
    
  })
  
  const tabelHref = (smena, tSkladNaryad) => {
    return 'proizvodstvo1/tabel.html?smena_id='+smena.id+'&naryad_id='+tSkladNaryad.id
  }
  const onDragStartCopyTabel = (e, table, method) => {
    e.dataTransfer.dropEffect = 'move'
    e.dataTransfer.effectAllowed = 'move'

    e.dataTransfer.setData('method', method)
    e.dataTransfer.setData('table_id', table.id.toString())
  }
  const onDragStartMove = (e, staff, tablelist, method) => {
    e.dataTransfer.dropEffect = 'move'
    e.dataTransfer.effectAllowed = 'move'

    e.dataTransfer.setData('method', method)
    e.dataTransfer.setData('staff_id', staff.id.toString())
    e.dataTransfer.setData('tablelist_id', tablelist.id.toString())
  }
  const onDragStart = (e, staff, method) => {
    e.dataTransfer.dropEffect = 'move'
    e.dataTransfer.effectAllowed = 'move'

    e.dataTransfer.setData('method', method)
    e.dataTransfer.setData('staff_id', staff.id.toString())
  }
  
  const onDrop = async (e, smena, tSkladNaryad) => {
    const method = e.dataTransfer.getData('method')
    let params
    let staff_id
    const smenadate = new Date(smena.date)

    if(smenadate < new Date(smena.date)){
      toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Смена уже в прошлом!', life: 3000 })
      return
    }
    switch(method){
      case 'copyTabel':
        const table_id = parseInt(e.dataTransfer.getData('table_id'))

        const row = bgColorSmenaNaryad(smena,tSkladNaryad)
        if(row.sum_teor_time > 0){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Смена уже имеет назначенные работы!', life: 3000 })
          return
        }
        const sourcegtsBTableListArr = Data.value.gtsBTableList.filter(x=>x.table_id == table_id)
        if(sourcegtsBTableListArr.length == 0){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Пустой табель!', life: 3000 })
          return
        }
        const targetgtsBTableArr = Data.value.gtsBTable.filter(x=>x.smena_id == smena.id 
        && x.department_id == tSkladNaryad.department_id)
        if(targetgtsBTableArr.length != 1){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не найден табель!', life: 3000 })
          return
        }
        const targettable = targetgtsBTableArr[0]

        const targetgtsBTableListArr = Data.value.gtsBTableList.filter(x=>x.smena_id == smena.id 
          && x.department_id == tSkladNaryad.department_id)

        for (const tablelist of targetgtsBTableListArr) {
          
          try{
            const {data} = await axios.post('/api/gtsBTableList',{api_action:'delete', ids:[tablelist.id]})
            if(!data.success){
              toast.add({ severity: 'error', summary: 'Ошибка', detail: data.message, life: 3000 })
              return
            }
          }catch(error){
              toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message, life: 3000 })
              return
          }
        }
        for (const tablelist of sourcegtsBTableListArr) {
          params = {
            table_id:targettable.id,
            smena_id: smena.id,
            department_id: tSkladNaryad.department_id,
            staff_id: tablelist.staff_id,
            teor_ktu: tablelist.teor_ktu,
            reserve_time: tablelist.reserve_time,
            teor_time:0,
          }
          
          try{
            const {data} = await axios.put('/api/gtsBTableList',params)
            if(!data.success){
              toast.add({ severity: 'error', summary: 'Ошибка', detail: data.message, life: 3000 })
              return
            }
          }catch(error){
              toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message, life: 3000 })
              return
          }
        }

        getTable('gtsBTableList',{
          query:'getTable',
          filters:{
            smena_id:{
              class:'gtsBTable',
              value:smena_ids,
              matchMode:'in'
            },
          },
          sortField:'teor_ktu',
          sortOrder:0
        })
      break
      case 'moveStaff':
        staff_id = parseInt(e.dataTransfer.getData('staff_id'))
        const tablelist_id = parseInt(e.dataTransfer.getData('tablelist_id'))

        if(Data.value.gtsBTableList.filter(x=>x.smena_id == smena.id 
        && x.department_id == tSkladNaryad.department_id 
        && x.staff_id == staff_id).length > 0){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Сотрудник уже в смене!', life: 3000 })
          return
        }

        const newgtsBTableArr = Data.value.gtsBTable.filter(x=>x.smena_id == smena.id 
        && x.department_id == tSkladNaryad.department_id)
        if(newgtsBTableArr.length != 1){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не найден табель!', life: 3000 })
          return
        }
        const newtable = newgtsBTableArr[0]

        const oldgtsBTableListArr = Data.value.gtsBTableList.filter(x=>x.id == tablelist_id)
        if(oldgtsBTableListArr.length != 1){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не найден табель!', life: 3000 })
          return
        }
        const oldtablelist = oldgtsBTableListArr[0]

        params = {
          table_id:newtable.id,
          smena_id: smena.id,
          department_id: tSkladNaryad.department_id,
          staff_id: staff_id.toString(),
          teor_ktu: oldtablelist.teor_ktu,
          reserve_time: oldtablelist.reserve_time,
          teor_time:0,
        }
        axios.put('/api/gtsBTableList',params)
        .then(function (response) {
          // console.log(response.data);
          if(response.data.success){
            params.id = parseInt(response.data.data.id)
            // Data.value.gtsBTableList.push(params)

            axios.post('/api/gtsBTableList',{api_action:'delete', ids:[tablelist_id]})
            .then(function (response) {
              // console.log(response.data);
              if(response.data.success){
                // Data.value.gtsBTableList = Data.value.gtsBTableList.filter( obj => obj.id != tablelist_id)
                getTable('gtsBTableList',{
                  query:'getTable',
                  filters:{
                    smena_id:{
                      class:'gtsBTable',
                      value:smena_ids,
                      matchMode:'in'
                    },
                  },
                  sortField:'teor_ktu',
                  sortOrder:0
                })
                toast.add({ severity: 'success', summary: 'Успешно', detail: 'Перемешено!', life: 3000 })
              }else{
                toast.add({ severity: 'error', summary: 'Ошибка', detail: response.data.message, life: 3000 })
              }
            })
            .catch(function (error) {
              toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message, life: 3000 })
            });
            
          }else{
            toast.add({ severity: 'error', summary: 'Ошибка', detail: response.data.message, life: 3000 })
          }
        })
        .catch(function (error) {
          toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message, life: 3000 })
        });
      break
      case 'copyStaff':
        staff_id = parseInt(e.dataTransfer.getData('staff_id'))
        const StaffArr = Staffs.value.filter(x=>x.id == staff_id) 

        if(StaffArr.length != 1){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Ошибка получения данных!', life: 3000 })
          return
        }

        if(Data.value.gtsBTableList.filter(x=>x.smena_id == smena.id 
        && x.department_id == tSkladNaryad.department_id 
        && x.staff_id == staff_id).length > 0){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Сотрудник уже в смене!', life: 3000 })
          return
        }

        const gtsBTableArr = Data.value.gtsBTable.filter(x=>x.smena_id == smena.id 
        && x.department_id == tSkladNaryad.department_id)
        if(gtsBTableArr.length != 1){
          toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не найден табель!', life: 3000 })
          return
        }

        const staff = StaffArr[0]
        const table = gtsBTableArr[0]
        params = {
          table_id:table.id,
          smena_id: smena.id,
          department_id:tSkladNaryad.department_id,
          staff_id:staff.id,
          teor_ktu:staff.teor_ktu,
          reserve_time:8,
          teor_time:0,
        }
        axios.put('/api/gtsBTableList',params)
        .then(function (response) {
          // console.log(response.data);
          if(response.data.success){
            params.id = parseInt(response.data.data.id)
            // Data.value.gtsBTableList.push(params)
            getTable('gtsBTableList',{
              query:'getTable',
              filters:{
                smena_id:{
                  class:'gtsBTable',
                  value:smena_ids,
                  matchMode:'in'
                },
              },
              sortField:'teor_ktu',
              sortOrder:0
            })
            toast.add({ severity: 'success', summary: 'Успешно', detail: 'Сделано!', life: 3000 })
          }else{
            toast.add({ severity: 'error', summary: 'Ошибка', detail: response.data.message, life: 3000 })
          }
        })
        .catch(function (error) {
          toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message, life: 3000 })
        });
      break
    }
    
  }
  const formatDate = (date) =>{
    return new Date(date).toLocaleDateString()
  }
  const isWeekend = (date) =>{
    let dayOfWeek = new Date(date).getDay()
    return (dayOfWeek === 6) || (dayOfWeek  === 0)
  }
  
  const bgColorSmena = (smena) =>{
    let row = {
      sum_reserve_time:0,
      sum_teor_time:0,
      proc:0,
    }
    let koef_time
    let teor_time
    let naryad_id = 0
    Data.value.gtsBTableList.filter(x=>x.smena_id == smena.id)
    .forEach((table) => {
      // console.log('table.teor_time',table.teor_time)
      teor_time = table.teor_time
      if(Data.value.tSkladNaryad.length > 0){
        naryad_id = Data.value.tSkladNaryad.filter(x=>table.department_id === x.department_id)[0].id
      }
      if(Data.value.tSkladNaryadSmena.length > 0 && naryad_id > 0){
        koef_time = Data.value.tSkladNaryadSmena.filter(x=>x.smena_id === smena.id && naryad_id === x.naryad_id)[0].koef_time
        teor_time = teor_time*koef_time
      }
      if(table.reserve_time) row.sum_reserve_time += parseFloat(table.reserve_time*table.teor_ktu)
      if(table.teor_time) row.sum_teor_time += parseFloat(teor_time)
    })
    if(row.sum_reserve_time > 0) row.proc = Math.ceil(row.sum_teor_time/row.sum_reserve_time*100)

    row.color = getColor(row.proc)
    return row
  }
  const bgColorSmenaNaryad = (smena,tSkladNaryad) =>{
    let row = {
      sum_reserve_time:0,
      sum_teor_time:0,
      proc:0,
    }
    Data.value.gtsBTableList.filter(x=>x.smena_id === smena.id && tSkladNaryad.department_id === x.department_id)
    .forEach((table) => {
      if(table.reserve_time) row.sum_reserve_time += parseFloat(table.reserve_time*table.teor_ktu)
      if(table.teor_time) row.sum_teor_time += parseFloat(table.teor_time)
    })
    let koef_time
    if(Data.value.tSkladNaryadSmena.length > 0){
      koef_time = Data.value.tSkladNaryadSmena.filter(x=>x.smena_id === smena.id && tSkladNaryad.id === x.naryad_id)[0].koef_time
      row.sum_teor_time = row.sum_teor_time*koef_time
    }
    if(row.sum_reserve_time > 0) row.proc = Math.ceil(row.sum_teor_time/row.sum_reserve_time*100)
    row.color = getColor(row.proc)
    return row
  }
  const getColor = (proc) => {

    let color
    if(proc <= 30){
        color = '#91e97a'; //зеленый
    }else if(proc <= 60){
        color = '#e7e97a'; //желтый
    }else if(proc <= 100){
        color = '#e98e7a'; //красный
    }else if(proc <= 200){
        color = '#ed5e3e'; //темно-красный
    }else{
        color = '#d7310c'; //темно-темно-красный
    }
    return color;
  };

  watch(loading_gtsBStaff, () => {
    if(Data.value.hasOwnProperty('gtsBStaff')){
      Staffs.value = []
      Data.value.gtsBStaff.forEach((row) => {
        let arrfio = row.name.split(' ');
        let fio = arrfio[0]
        if(arrfio[1]) fio += ' ' + arrfio[1][0] + '.'
        if(arrfio[2]) fio += ' ' + arrfio[2][0] + '.'
        row.fio = fio
        Staffs.value.push(row)
      });
    }
    loading_gtsBStaff.value = false
  })
  watch(loading_tSkladSmena, () => {
    if(Data.value.hasOwnProperty('tSkladSmena') && Data.value.hasOwnProperty('tSkladNaryad')){
      if(Data.value.tSkladSmena.length > 0 && Data.value.tSkladNaryad.length > 0){
        
        Data.value.tSkladSmena.forEach((row) => {
          smena_ids.push(row.id)
        });
        // let department_ids = []
        // Data.value.tSkladNaryad.forEach((row) => {
        //   department_ids.push(row.department_id)
        // });
        getTable('gtsBTableList',{
          query:'getTable',
          filters:{
            smena_id:{
              class:'gtsBTable',
              value:smena_ids,
              matchMode:'in'
            },
          },
          sortField:'teor_ktu',
          sortOrder:0
        })
        getTable('gtsBTable',{
          filters:{
            smena_id:{
              value:smena_ids,
              matchMode:'in'
            },
          },
          sortField:'id',
          sortOrder:1
        })
        getTable('tSkladNaryadSmena',{
          filters:{
            smena_id:{
              class:'tSkladNaryadSmena',
              value:smena_ids,
              matchMode:'in'
            },
          },
          sortField:'id',
          sortOrder:0
        })
      }
    }
    loading_tSkladSmena.value = false
  
  })
  const loadData = () => {
    // console.log(date.value.toLocaleDateString())
    getTable('tSkladSmena',{
      filters:{
        date:{
          value:date.value.toLocaleDateString(),
          matchMode:'dateAfter'
        }
      },
      sortField:'date',
      sortOrder:1,
      limit:20
    })
    
  };
 
  const currentSmena = ref(0)
  const sCurrentSmena = (smena_id) => {
    currentSmena.value = smena_id
  };
  const getTable = (table,params) => {
    axios.get('/api/' + table,{ params: params})
    .then(function (response) {
      // console.log(response.data);
      if(response.data.success){
        Data.value[table] = [];
      
        response.data.data.rows.forEach((row) => {
          Data.value[table].push(row)
        });
        if(table == 'gtsBStaff') loading_gtsBStaff.value = true
        if(table == 'tSkladSmena') loading_tSkladSmena.value = true
        if(table == 'tSkladNaryad') loading_tSkladSmena.value = true
        if(table == 'gtsBTableList') loading_gtsBTableList.value = true
        //console.log(Data.value[table])
        toast.add({ severity: 'success', summary: 'Успешно', detail: table + ' загружен!', life: 3000 })
      }else{
        toast.add({ severity: 'error', summary: 'Ошибка', detail: response.data.message, life: 3000 })
      }
      
    })
    .catch(function (error) {
      toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message, life: 3000 })
    });
  };
</script>
<style>
  .workload-table td,.workload-table th{
    padding: 8px;
    border: 1px solid #555;
    vertical-align: top;
    color:black;
  }
  .workload-table{
    border: 1px solid #ddd;
  }
  .workload-table a {
    white-space: nowrap;
    color:black;
  }
  .workload-table span {
    white-space: nowrap;
    color:black;
  }
  .workload-table .staff-menu {
    padding: 0;
    margin: 0;
  }
  .workload-table .staff-menu li{
    list-style-type: none;
  }
  .workload-table .weekend{
    border: 3px solid red;
  }
  .workload-table th {
    position: sticky;
    top: 0;
    background: white;
  }
  .workload-table .naryad {
    position: sticky;
    left: 200px;
    background: white;
  }
  .part{
    display:inline-block;
    vertical-align:top;
  }
  .outer{
    position: relative;
    width: 8000px;
    display: block;
  }
  .smena{
    width: 200px;
    position: sticky;
    left: 0;
    top:0;
    background: white;
    overflow-y: scroll;
    height: 95vh;
    z-index: 10;
  }
</style>