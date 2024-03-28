export default {
    tsklad:{
        name:'tsklad',
        gtsAPITables:[
            {
                class:'tSkladSmena',
                tree: false,
                authenticated:true,
                groups:'',
                permitions:'',
                active:true,
                properties: {
                    actions:{
                        read:{
                            test:1
                        }
                    }
                }
            },
            {
                class:'tSkladNaryad',
                tree: false,
                authenticated:true,
                groups:'',
                permitions:'',
                active:true,
                properties: {
                    actions:{
                        read:{}
                    }
                }
            },
            {
                class:'tSkladNaryadSmena',
                tree: false,
                authenticated:true,
                groups:'',
                permitions:'',
                active:true,
                properties: {
                    actions:{
                        read:{},
                        update:{
                            groups:'ceh_boss,Administrator',
                        },
                    }
                }
            },
        ]
    },
    gtsbalance:{
        name:'gtsbalance',
        gtsAPITables:[
            {
                class:'gtsBTable',
                tree: false,
                authenticated:true,
                groups:'',
                permitions:'',
                active:true,
                properties: {
                    actions:{
                        read:{}
                    },
                    
                }
            },
            {
                class:'gtsBStaff',
                tree: false,
                authenticated:true,
                groups:'',
                permitions:'',
                active:true,
                properties: {
                    actions:{
                        read:{},
                        update:{
                            groups:'ceh_boss',
                        },
                    },
                    queryes:{
                        cehStaff:{
                            class:'gtsBStaff',
                            leftJoin:{
                                gtsBDepartmentStaffLink:{
                                    class:'gtsBDepartmentStaffLink',
                                    on:'gtsBDepartmentStaffLink.staff_id=gtsBStaff.id'
                                }
                            },
                            where:{
                                'gtsBDepartmentStaffLink.department_id':1,
                                'gtsBStaff.active':1,
                            },
                            select:{
                                gtsBStaff:'*',
                            }
                        }
                    }
                }
            },
            {
                class:'gtsBTableList',
                tree: false,
                authenticated:true,
                groups:'',
                permitions:'',
                active:true,
                properties: {
                    actions:{
                        read:{},
                        create:{
                            groups:'ceh_boss,Administrator',
                        },
                        update:{
                            groups:'ceh_boss,Administrator',
                        },
                        delete:{
                            groups:'ceh_boss,Administrator',
                        },
                    },
                    queryes:{
                        getTable:{
                            class:'gtsBTable',
                            leftJoin:{
                                gtsBTableList:{
                                    class:'gtsBTableList',
                                    on:'gtsBTableList.table_id=gtsBTable.id'
                                }
                            },
                            select:{
                                gtsBTableList:'*',
                                gtsBTable:'gtsBTable.smena_id,gtsBTable.department_id',
                            }
                        }
                    }
                }
            },
        ]
    },
}
