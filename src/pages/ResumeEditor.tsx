import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Eye } from "lucide-react";
import ResumeBuilder from "./ResumeBuilder";

export default function ResumeEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const title = useMemo(() => (id === "new" ? "New Resume" : `Resume #${id}`), [id]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/resume")}> 
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline"><Eye className="h-4 w-4 mr-2" />Preview</Button>
          <Button><Download className="h-4 w-4 mr-2" />Download PDF</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <ResumeBuilder initialTab="builder" showTabs={false} />
        </CardContent>
      </Card>
    </div>
  );
}


