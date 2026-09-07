'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { grievanceCategories } from '@/lib/grievance-categories';
import { useLanguage } from './language-provider';

type Vote = 'up' | 'down' | null;
type Row = { public_id:string;title:string;category:string;status:string;public_geohash:string|null;submitted_at:string;resolved_at:string|null;assigned_authority:string|null;has_dispute:boolean;upvotes:number;downvotes:number };
type Dispute = { public_id:string;title:string;public_note:string;created_at:string };
type Filters = { pin:string;category:string };

export default function PublicLog() {
  const { language,t } = useLanguage();
  const [rows,setRows] = useState<Row[]>([]);
  const [disputes,setDisputes] = useState<Dispute[]>([]);
  const [draft,setDraft] = useState<Filters>({pin:'',category:'all'});
  const [filters,setFilters] = useState<Filters>({pin:'',category:'all'});
  const [votes,setVotes] = useState<Record<string,Vote>>({});
  const [notice,setNotice] = useState(t('Loading public log…','सार्वजनिक रिकॉर्ड लोड हो रहा है…'));
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams(filters).toString();
    setLoading(true);
    fetch(`/api/public-log?${query}`,{signal:controller.signal,cache:'no-store'})
      .then(async response => { const data=await response.json();if(!response.ok)throw new Error(data.error);return data; })
      .then(data => {
        setRows(data.rows||[]);setDisputes(data.disputes||[]);
        setNotice(data.demo?t('Connect Vercel Postgres to display live public records.','लाइव सार्वजनिक रिकॉर्ड के लिए Vercel Postgres जोड़ें।'):'');
        const stored:Record<string,Vote>={};
        for(const row of data.rows||[]){const value=localStorage.getItem(`jansahay:vote:${row.public_id}`);stored[row.public_id]=value==='up'||value==='down'?value:null}
        setVotes(stored);
      })
      .catch(error=>{if(error instanceof Error&&error.name!=='AbortError')setNotice(t('Public log is temporarily unavailable.','सार्वजनिक रिकॉर्ड अस्थायी रूप से उपलब्ध नहीं है।'))})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return ()=>controller.abort();
  },[filters,t]);

  const date=(value:string,withTime=false)=>new Intl.DateTimeFormat(language==='hi'?'hi-IN':'en-IN',withTime?{dateStyle:'medium',timeStyle:'short'}:{dateStyle:'medium'}).format(new Date(value));
  const categoryName=(name:string)=>language==='hi'?grievanceCategories.find(item=>item.name===name)?.nameHi||name:name;
  const status=(value:string)=>({submitted:t('submitted','दर्ज'),acknowledged:t('assigned','आवंटित'),in_progress:t('in progress','कार्य जारी'),resolved_by_authority:t('fix reported','समाधान दर्ज'),confirmed_closed:t('closed','बंद'),closed:t('closed','बंद'),disputed:t('disputed','विवादित'),escalated:t('escalated','उच्च स्तर पर भेजी गई')}[value]||value.replaceAll('_',' '));
  const exportUrl=useMemo(()=>`/api/export/complaints?${new URLSearchParams(filters).toString()}`,[filters]);

  function applyFilters(event:FormEvent){event.preventDefault();setFilters({pin:draft.pin.replace(/\D/g,'').slice(0,6),category:draft.category})}
  function clearFilters(){const empty={pin:'',category:'all'};setDraft(empty);setFilters(empty)}

  async function vote(publicId:string,next:'up'|'down') {
    const previous=votes[publicId]||null;
    const selected:Vote=previous===next?null:next;
    try {
      const response=await fetch(`/api/public-log/${publicId}/vote`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vote:selected,previous}),cache:'no-store'});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      setRows(current=>current.map(row=>row.public_id===publicId?{...row,upvotes:data.upvotes,downvotes:data.downvotes}:row));
      setVotes(current=>({...current,[publicId]:selected}));
      if(selected)localStorage.setItem(`jansahay:vote:${publicId}`,selected);else localStorage.removeItem(`jansahay:vote:${publicId}`);
    } catch { setNotice(t('Your reaction could not be saved. Please try again.','आपकी प्रतिक्रिया सहेजी नहीं जा सकी। पुनः प्रयास करें।')) }
  }

  return <>
    <div className="panel public-register">
      <div className="head"><div><h2 style={{fontSize:18}}>{t('Complaint register','शिकायत रजिस्टर')}</h2><p>{t('Names, contacts, exact location and evidence are excluded.','नाम, संपर्क, सटीक स्थान और साक्ष्य शामिल नहीं हैं।')}</p></div><a href={exportUrl} className="action secondary">{t('Download filtered CSV','फ़िल्टर किया CSV डाउनलोड करें')}</a></div>
      <form className="public-log-filters" onSubmit={applyFilters}>
        <label><span>{t('PIN code or prefix','पिन कोड या शुरुआती अंक')}</span><input value={draft.pin} onChange={event=>setDraft(current=>({...current,pin:event.target.value.replace(/\D/g,'').slice(0,6)}))} inputMode="numeric" placeholder={t('e.g. 110 or 110001','जैसे 110 या 110001')} maxLength={6}/></label>
        <label><span>{t('Category','श्रेणी')}</span><select value={draft.category} onChange={event=>setDraft(current=>({...current,category:event.target.value}))}><option value="all">{t('All categories','सभी श्रेणियाँ')}</option>{grievanceCategories.map(category=><option value={category.id} key={category.id}>{language==='hi'?category.nameHi:category.name}</option>)}</select></label>
        <button className="action" disabled={loading}>{loading?t('Loading…','लोड हो रहा है…'):t('Apply filters','फ़िल्टर लगाएँ')}</button>
        <button type="button" className="action secondary" onClick={clearFilters}>{t('Clear','हटाएँ')}</button>
        <span className="filter-result">{rows.length} {t('records shown','रिकॉर्ड दिखाए गए')}</span>
      </form>
      {notice&&<p className="notice warn">{notice}</p>}
      <div className="tablewrap"><table className="table public-log-table"><thead><tr><th>{t('Reference','संदर्भ')}</th><th>{t('Issue','समस्या')}</th><th>{t('Category','श्रेणी')}</th><th>{t('Public area cell','सार्वजनिक क्षेत्र')}</th><th>{t('Authority','प्राधिकरण')}</th><th>{t('Status','स्थिति')}</th><th>{t('Filed','दर्ज')}</th><th>{t('Public reaction','जन प्रतिक्रिया')}</th></tr></thead><tbody>{rows.map(row=><tr key={row.public_id}><td><b>{row.public_id}</b></td><td>{row.title}{row.has_dispute&&<><br/><span className="badge red">{t('disputed','विवादित')}</span></>}</td><td>{categoryName(row.category)}</td><td>{row.public_geohash||t('Not published','प्रकाशित नहीं')}</td><td>{row.assigned_authority||t('Routing in progress','रूटिंग जारी')}</td><td><span className="badge">{status(row.status)}</span></td><td>{date(row.submitted_at)}</td><td><div className="vote-controls"><button type="button" className={votes[row.public_id]==='up'?'selected up':''} onClick={()=>vote(row.public_id,'up')} aria-label={t('Upvote this issue','इस समस्या को समर्थन दें')}>▲ <span>{row.upvotes}</span></button><button type="button" className={votes[row.public_id]==='down'?'selected down':''} onClick={()=>vote(row.public_id,'down')} aria-label={t('Downvote this issue','इस समस्या को असहमति दें')}>▼ <span>{row.downvotes}</span></button></div></td></tr>)}{!rows.length&&!loading&&<tr><td colSpan={8} className="empty">{t('No public records match these filters.','इन फ़िल्टर से कोई सार्वजनिक रिकॉर्ड नहीं मिला।')}</td></tr>}</tbody></table></div>
      <p className="sub reaction-note">{t('Reactions are lightweight public-interest signals, not votes on whether a grievance is valid. This showcase stores only aggregate counters.','प्रतिक्रियाएँ जनहित के हल्के संकेत हैं, शिकायत की वैधता पर मतदान नहीं। यह डेमो केवल कुल संख्या संग्रहीत करता है।')}</p>
    </div>
    <section className="section"><div className="head"><div><h2>{t('Public dispute log','सार्वजनिक विवाद रिकॉर्ड')}</h2><p>{t('Reporter disputes remain part of the accountability record. Personal details are removed.','शिकायतकर्ता के विवाद जवाबदेही रिकॉर्ड का हिस्सा रहते हैं। निजी जानकारी हटा दी जाती है।')}</p></div></div><div className="cardlist">{disputes.map(dispute=><article className="case" key={dispute.public_id+dispute.created_at}><div className="casehead"><div><h3>{dispute.public_id} · {dispute.title}</h3><p>{t('Disputed','विवादित')} {date(dispute.created_at,true)}</p></div><span className="badge red">{t('Fix disputed','समाधान विवादित')}</span></div><p style={{marginTop:10}}>{dispute.public_note}</p></article>)}{!disputes.length&&!loading&&<div className="panel empty">{t('No disputes match these filters.','इन फ़िल्टर से कोई विवाद नहीं मिला।')}</div>}</div></section>
  </>;
}
