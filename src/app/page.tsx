import Link from "next/link";
import { MessageCircle, Users, Phone, Image } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-line-green to-line-green-dark">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-4">LINE Chat</h1>
          <p className="text-xl opacity-90">
            เชื่อมต่อกับเพื่อนและครอบครัวได้ทุกที่ทุกเวลา
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="text-center p-6">
              <div className="bg-line-green/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-line-green" />
              </div>
              <h3 className="font-semibold text-lg mb-2">แชทแบบเรียลไทม์</h3>
              <p className="text-gray-600 text-sm">
                ส่งข้อความ รูปภาพ และไฟล์ได้ทันที
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-line-green/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-line-green" />
              </div>
              <h3 className="font-semibold text-lg mb-2">กลุ่มแชท</h3>
              <p className="text-gray-600 text-sm">
                สร้างกลุ่มและพูดคุยกับหลายคนพร้อมกัน
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-line-green/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-line-green" />
              </div>
              <h3 className="font-semibold text-lg mb-2">โทรเสียงและวิดีโอ</h3>
              <p className="text-gray-600 text-sm">
                โทรฟรีทั้งเสียงและวิดีโอคอล
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-line-green/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="w-8 h-8 text-line-green" />
              </div>
              <h3 className="font-semibold text-lg mb-2">สติ๊กเกอร์และอิโมจิ</h3>
              <p className="text-gray-600 text-sm">
                แสดงความรู้สึกด้วยสติ๊กเกอร์สุดน่ารัก
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-line-green hover:bg-line-green-dark text-white font-semibold py-3 px-8 rounded-full transition-colors text-center"
            >
              สมัครสมาชิก
            </Link>
            <Link
              href="/login"
              className="bg-white hover:bg-gray-50 text-line-green font-semibold py-3 px-8 rounded-full border-2 border-line-green transition-colors text-center"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>

        <div className="text-center text-white mt-12 opacity-75">
          <p>&copy; 2026 LINE Chat. Built with Next.js & PostgreSQL</p>
        </div>
      </div>
    </div>
  );
}
