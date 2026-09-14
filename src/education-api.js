import {useCallback,useEffect,useState} from 'react';
export async function educationRequest(path, options={}) {
 const response=await fetch('/app-api/education'+path,{...options,headers:{'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(12000)});
 if(!response.ok) throw new Error('服务暂时不可用，请稍后重试。');
 const result=await response.json();
 if(result.code!==0) throw new Error(result.msg||'操作未完成，请重试。');
 return result.data;
}
export function useCourses(){
 const [data,setData]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const reload=useCallback(()=>{setLoading(true);setError('');educationRequest('/courses').then(setData).catch(()=>setError('课程暂时未能加载，请稍后重试。')).finally(()=>setLoading(false))},[]);
 useEffect(reload,[reload]);
 return {data,loading,error,reload};
}
