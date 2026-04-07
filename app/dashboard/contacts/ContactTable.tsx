import { Contact } from "./contactUtils"


interface Props {
  contacts: Contact[]
}

export default function ContactTable({ contacts }: Props) {
  if (contacts.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">
        Preview ({contacts.length} valid contacts)
      </h2>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              {Object.keys(contacts[0]).map((key) => (
                <th key={key} className="p-2 text-left">
                  {key}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {contacts.slice(0, 10).map((contact, index) => (
              <tr key={index} className="border-t">
                {Object.values(contact).map((value, i) => (
                  <td key={i} className="p-2">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contacts.length > 10 && (
        <p className="text-gray-500 mt-2">
          Showing first 10 records...
        </p>
      )}
    </div>
  )
}


