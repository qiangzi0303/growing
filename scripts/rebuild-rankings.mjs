// Rebuild derived scores from existing cloud documents after migration 0003.
// Supply an existing administrator session token via GROWING_ADMIN_TOKEN.
const site=process.argv[2],token=process.env.GROWING_ADMIN_TOKEN;
if(!site||!token)throw Error('Usage: GROWING_ADMIN_TOKEN=<session token> node scripts/rebuild-rankings.mjs https://007yx.com');
const origin=new URL(site);
if(origin.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(origin.hostname))throw Error('HTTPS is required.');
let page=1,total=0;
while(page!==null){
  const response=await fetch(new URL('/api/admin/leaderboards/rebuild?page='+page,origin),{
    method:'POST',headers:{Authorization:'Bearer '+token,'X-Growing-Client':'1'},signal:AbortSignal.timeout(120000),redirect:'error',
  });
  if(!response.ok)throw Error('Rebuild stopped at page '+page+': HTTP '+response.status+'. Retry after checking authorization and migration 0003.');
  const result=await response.json();total+=result.indexed;page=result.nextPage;
  console.log('Indexed '+total+' students; next page: '+(page??'complete'));
}
