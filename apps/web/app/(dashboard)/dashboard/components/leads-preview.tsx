import LeadStatus from "@/components/lead-status"

export default function LeadsPreview(){

  const leads = [
    {date:"Apr 24",status:"New"},
    {date:"Apr 24",status:"Contacted"},
    {date:"Apr 24",status:"Follow-Up"},
    {date:"Apr 24",status:"Converted"},
    {date:"Apr 24",status:"Lost"}
  ]

  return (
    <div style={{marginTop:20}}>

      <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.3px" }}>Leads Summary</h3>

      <div
        style={{
          border:"1px solid var(--card-border)",
          borderRadius:12,
          padding:12,
          marginTop:10,
          background: "var(--card)",
          boxShadow: "0 4px 12px var(--shadow)",
        }}
      >
        {leads.map((l, i)=>(
          <div
            key={`${l.date}-${l.status}-${i}`}
            style={{
              display:"flex",
              justifyContent:"space-between",
              alignItems: "center",
              padding:"10px 0",
              borderBottom: i === leads.length - 1 ? "none" : "1px solid var(--card-border)",
            }}
          >
            <span style={{ color: "var(--text)", fontWeight: 500 }}>{l.date}</span>
            <LeadStatus status={l.status}/>
          </div>
        ))}
      </div>

    </div>
  )
}