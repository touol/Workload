console.log('upload config on site!');

import fs from 'fs/promises';
import axios from 'axios';
import config from "./config.js";
import snippets from "./configs/snippets.js";
import settings from "./configs/settings.js";
import gtsapirules from "./configs/gtsapirules.js"
import gtsapipackages from "./configs/gtsapipackages.js"
import FormData from 'form-data';
import 'dotenv/config'

// console.log(config)
const form = new FormData()
//console.log('process.env',process.env)        
form.append('config', JSON.stringify(config))

if(config.schema){
    try{
        const file = await fs.readFile('./_build/configs/schema.xml')
        form.append('schema', file, 'schema.xml')
    }catch(e){
        console.log('Ошибка файла', './_build/configs/schema.xml', e)
    }
}

for(let k in snippets){
    try{
        const file = await fs.readFile('./_build/snippets/' + snippets[k].file)
        form.append(snippets[k].file, file, snippets[k].file)
    }catch(e){
        console.log('Ошибка файла', snippets[k].file, e)
    }
}
form.append('snippets', JSON.stringify(snippets))
form.append('settings', JSON.stringify(settings))
form.append('gtsapirules', JSON.stringify(gtsapirules))
form.append('gtsapipackages', JSON.stringify(gtsapipackages))

const fileExists = async path => !!(await fs.stat(path).catch(e => false));
if (await fileExists('./core')) {
    await fs.cp("./core", `${process.env.VITE_APP_CORE_DIR}`, { recursive: true });
}
let error = null;
try {
    const url = `${process.env.VITE_APP_PROTOCOL}://${process.env.VITE_APP_HOST}/api/package`
    //console.log('url',url)
    const res = await axios.post(url,form,{
        headers: { Authorization: `Bearer ${process.env.DEV_TOKEN}` }
    }).catch(err => {
    if (err.response.status === 404) {
        throw new Error(`${err.config.url} not found`);
    }
    throw err;
    });
    if(res.data.success){
        console.log(res.data.message)
    }else{
        console.log(res.data)
    }
    
}catch (err) {
    error = err;
}
if(error)
    console.log('error',error.message,error.response.data)
